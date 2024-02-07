import { appendFile } from 'fs/promises';
import { Driver } from './Driver';
import type { Operation } from './operations/Operation';
import { OperationFactory } from './operations/OperationFactory';
import type { BenchmarkConfig } from './Types';

export class QueryRunner {
  private readonly operations: Operation[];

  private readonly benchmarkConfig: BenchmarkConfig;

  public constructor(
    operations: Operation[],
    benchmarkConfig: BenchmarkConfig,
  ) {
    this.operations = operations;
    this.benchmarkConfig = benchmarkConfig;
  }

  public static BuildCSVHeader(benchmarkConfig: BenchmarkConfig): string {
    return 'operationName,' +
      'isTransformation,' +
      'runNr,' +
      'transformationNr,' +
      'queryTime(seconds),' +
      'queryTime(nanoseconds),' +
      'memoryUsed\n';
  }

  public static async setupQueryRunner(
    benchmarkConfig: BenchmarkConfig,
  ): Promise<QueryRunner> {
    // Init + read
    // console.log('init + read');
    const driver = await Driver.create(benchmarkConfig);

    const operations = [];
    for (const operationSting of benchmarkConfig.operationStings) {
      operations.push(OperationFactory.create(operationSting, driver, benchmarkConfig));
    }

    return new QueryRunner(operations, benchmarkConfig);
  }

  public async run(): Promise<void> {
    const benchmarkResults: {
      operationName: string;
      isTransformation: boolean;
      transformationNr: number;
      queryTimes: number;
      queryTimens: number;
      memoryUsed: number;
    }[] = [];

    // eslint-disable-next-line no-console
    console.log('Query');
    // Query
    for (const operation of this.operations) {
      if (!operation.transformation) {
        operation.flush();

        const initialQueryStart = process.hrtime();
        await operation.query();
        const time = process.hrtime(initialQueryStart);
        const memory = process.memoryUsage().heapUsed;

        benchmarkResults.push({
          operationName: operation.operationName,
          isTransformation: false,
          transformationNr: 0,
          queryTimes: time[0],
          queryTimens: time[1],
          memoryUsed: memory,
        });
      }
    }

    for (let i = 1; i < this.benchmarkConfig.numberOfTransforms + 1; i++) {
      // eslint-disable-next-line no-console
      console.log('Transform');
      // Transform
      for (const operation of this.operations) {
        if (operation.transformation) {
          operation.flush();

          const initialQueryStart = process.hrtime();
          await operation.transform();
          const time = process.hrtime(initialQueryStart);
          const memory = process.memoryUsage().heapUsed;

          benchmarkResults.push({
            operationName: operation.operationName,
            isTransformation: true,
            transformationNr: i,
            queryTimes: time[0],
            queryTimens: time[1],
            memoryUsed: memory,
          });
        }
      }
      // eslint-disable-next-line no-console
      console.log('Recheck');
      // Recheck
      for (const operation of this.operations) {
        if (!operation.transformation) {
          operation.flush();

          const initialQueryStart = process.hrtime();
          await operation.query();
          const time = process.hrtime(initialQueryStart);
          const memory = process.memoryUsage().heapUsed;

          benchmarkResults.push({
            operationName: operation.operationName,
            isTransformation: false,
            transformationNr: i,
            queryTimes: time[0],
            queryTimens: time[1],
            memoryUsed: memory,
          });
        }
      }
    }

    if (this.benchmarkConfig.runNr >= 0) {
      let content = '';
      for (const result of benchmarkResults) {
        content += `${result.operationName},`;
        content += `${result.isTransformation},`;
        content += `${this.benchmarkConfig.runNr},`;
        content += `${result.transformationNr},`;
        content += `${result.queryTimes},`;
        content += `${result.queryTimens},`;
        content += `${result.memoryUsed}\n`;
      }

      await appendFile(this.benchmarkConfig.resultsPath, content);
    }
  }
}
