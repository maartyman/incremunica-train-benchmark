import * as fs from 'fs';
import { appendFile } from 'fs/promises';
import { Driver } from './Driver';
import type { Operation } from './operations/Operation';
import { OperationFactory } from './operations/OperationFactory';
import type { BenchmarkConfig } from './Types';

export class QueryRunner {
  private readonly driver: Driver;

  private readonly operations: Operation[];

  private readonly benchmarkConfig: BenchmarkConfig;

  private readonly cachedResults: any;

  public constructor(
    driver: Driver,
    operations: Operation[],
    benchmarkConfig: BenchmarkConfig,
    cachedResults: any = {},
  ) {
    this.driver = driver;
    this.operations = operations;
    this.benchmarkConfig = benchmarkConfig;
    this.cachedResults = cachedResults;
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

    const pathArray = benchmarkConfig.dataPath.split('/');
    const cachedResultsFilePath = `${benchmarkConfig.cachedResultsBasePath +
      benchmarkConfig.randomSeed}#${
      benchmarkConfig.operationStings
        .map(str => str.replace(/[a-z]/gu, '')).join('#')}#${
      benchmarkConfig.matchTransformPercentage}#${
      pathArray[pathArray.length - 1]}.json`;

    const cachedResults = await new Promise<any>((resolve, reject) => {
      fs.readFile(
        cachedResultsFilePath,
        'utf8',
        (error, data) => {
          if (error) {
            resolve({});
          }
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        },
      );
    });

    cachedResults.cachedResultsFilePath = cachedResultsFilePath;

    return new QueryRunner(driver, operations, benchmarkConfig, cachedResults);
  }

  public async run(): Promise<void> {
    // Console.log('Start run');
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Not in production mode!');
    }

    const benchmarkResults: {
      operationName: string;
      isTransformation: boolean;
      transformationNr: number;
      queryTimes: number;
      queryTimens: number;
      memoryUsed: number;
    }[] = [];

    // Console.log('Query');
    // Query
    for (const operation of this.operations) {
      if (!operation.transformation) {
        // Console.log('Calculate num of results');
        await operation.calculateNumberOfResults(this.cachedResults, 0);

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
      // Console.log('Transform');
      // Transform
      for (const operation of this.operations) {
        if (operation.transformation) {
          // Console.log('Calculate num of results');
          await operation.calculateNumberOfResults(this.cachedResults, i);

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
      // Console.log('Recheck');
      // Recheck
      for (const operation of this.operations) {
        if (!operation.transformation) {
          // Console.log('Calculate num of results');
          await operation.calculateNumberOfResults(this.cachedResults, i);

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
