import { appendFile } from 'fs/promises';
import { Driver } from './Driver';
import type { Operation } from './operations/Operation';
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

  public static async setupQueryRunner(
    benchmarkConfig: BenchmarkConfig,
  ): Promise<QueryRunner> {
    // Init + read
    const driver = await Driver.create(benchmarkConfig);

    const operations = [];
    for (const operationCreator of benchmarkConfig.operationCreators) {
      operations.push(operationCreator(driver, benchmarkConfig));
    }

    return new QueryRunner(driver, operations, benchmarkConfig);
  }

  public async run(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Start run');
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Not in production mode!');
    }

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
      this.driver.streamingStore.halt();
      // Transform
      const transformStart = process.hrtime();
      for (const operation of this.operations) {
        if (operation.transformation) {
          await operation.transform();
        }
      }
      const transformTime = process.hrtime(transformStart);
      const transformMemoryUsed = process.memoryUsage().heapUsed;

      this.driver.streamingStore.resume();
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
