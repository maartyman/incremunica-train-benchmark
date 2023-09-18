import { appendFile } from 'fs/promises';
import { Driver } from './Driver';
import type { Operation } from './operations/Operation';
import { OperationFactory } from './operations/OperationFactory';
import type { BenchmarkConfig, Time } from './Types';

export class QueryRunner {
  private readonly driver: Driver;

  private readonly operations: Operation[];

  private readonly benchmarkConfig: BenchmarkConfig;

  public constructor(
    driver: Driver,
    operations: Operation[],
    benchmarkConfig: BenchmarkConfig,
  ) {
    this.driver = driver;
    this.operations = operations;
    this.benchmarkConfig = benchmarkConfig;
  }

  public static BuildCSVHeader(benchmarkConfig: BenchmarkConfig): string {
    let header = 'initialQueryTime(seconds),' +
      'initialQueryTime(nanoseconds),' +
      'initialMemoryUsed';

    for (let i = 0; i < benchmarkConfig.numberOfTransforms; i++) {
      header += `,transformTime(seconds)_transform-${i}`;
      header += `,transformTime(nanoseconds)_transform-${i}`;
      header += `,transformMemoryUsed_transform-${i}`;

      header += `,recheckTime(seconds)_transform-${i}`;
      header += `,recheckTime(nanoseconds)_transform-${i}`;
      header += `,recheckMemoryUsed_transform-${i}`;
    }

    header += '\n';
    return header;
  }

  public static async setupQueryRunner(
    benchmarkConfig: BenchmarkConfig,
  ): Promise<QueryRunner> {
    // Init + read
    console.log('init + read');
    const driver = await Driver.create(benchmarkConfig);

    const operations = [];
    for (const operationSting of benchmarkConfig.operationStings) {
      operations.push(OperationFactory.create(operationSting, driver, benchmarkConfig));
    }

    return new QueryRunner(driver, operations, benchmarkConfig);
  }

  public async run(): Promise<void> {
    console.log('Start run');
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Not in production mode!');
    }

    console.log('Calculate num of results');

    for (const operation of this.operations) {
      if (!operation.transformation) {
        await operation.calculateNumberOfResults();
      }
    }

    console.log('Query');

    // Query
    const initialQueryStart = process.hrtime();
    for (const operation of this.operations) {
      if (!operation.transformation) {
        await operation.query();
      }
    }
    const initialQueryTime = process.hrtime(initialQueryStart);
    const initialMemoryUsed = process.memoryUsage().heapUsed;

    const transformData: {
      transformTime: Time;
      transformMemoryUsed: number;
      recheckTime: Time;
      recheckMemoryUsed: number; }[] = [];

    for (let i = 0; i < this.benchmarkConfig.numberOfTransforms; i++) {
      // This.driver.streamingStore.halt();

      console.log('Transform');
      // Transform
      const transformStart = process.hrtime();
      for (const operation of this.operations) {
        if (operation.transformation) {
          await operation.calculateNumberOfResults();
          await operation.transform();
        }
      }
      const transformTime = process.hrtime(transformStart);
      const transformMemoryUsed = process.memoryUsage().heapUsed;

      // This.driver.streamingStore.resume();

      console.log('Calculate num of results');

      for (const operation of this.operations) {
        if (!operation.transformation) {
          await operation.calculateNumberOfResults();
        }
      }

      console.log('Recheck');
      // Recheck
      const recheckStart = process.hrtime();
      for (const operation of this.operations) {
        if (!operation.transformation) {
          await operation.query();
        }
      }
      const recheckTime = process.hrtime(recheckStart);
      const recheckMemoryUsed = process.memoryUsage().heapUsed;
      transformData.push({
        transformTime,
        transformMemoryUsed,
        recheckTime,
        recheckMemoryUsed,
      });
    }

    let content = `${initialQueryTime[0]},` +
      `${initialQueryTime[1]},` +
      `${initialMemoryUsed}`;

    for (const transformDataElement of transformData) {
      content += `,${transformDataElement.transformTime[0]}`;
      content += `,${transformDataElement.transformTime[1]}`;
      content += `,${transformDataElement.transformMemoryUsed}`;
      content += `,${transformDataElement.recheckTime[0]}`;
      content += `,${transformDataElement.recheckTime[1]}`;
      content += `,${transformDataElement.recheckMemoryUsed}`;
    }

    await appendFile(this.benchmarkConfig.resultsPath, content);
  }
}
