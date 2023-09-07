import { createReadStream } from 'fs';
import { appendFile } from 'fs/promises';
import { StreamingStore } from '@incremunica/incremental-rdf-streaming-store';
import type { Quad, Bindings } from '@incremunica/incremental-types';
import { QueryEngineFactory } from '@incremunica/query-sparql-incremental';
import type { QueryEngine } from '@incremunica/query-sparql-incremental';
import { DataFactory, StreamParser } from 'n3';
import type { IScenario } from './scenarios/IScenario';
import namedNode = DataFactory.namedNode;

export class QueryRunner {
  private readonly engine: QueryEngine;
  private readonly store: StreamingStore<Quad>;
  private readonly scenario: IScenario;
  private readonly resultsPath: string;

  public constructor(
    engine: QueryEngine,
    store: StreamingStore<Quad>,
    scenario: IScenario,
    resultsPath: string,
  ) {
    this.engine = engine;
    this.store = store;
    this.scenario = scenario;
    this.resultsPath = resultsPath;
    // This.store.match(namedNode(""),namedNode(""),namedNode(""));
  }

  public static setupQueryRunner(
    configPath: string,
    dataPath: string,
    scenario: IScenario,
    resultsPath: string,
  ): Promise<QueryRunner> {
    const queryEnginePromise = new QueryEngineFactory().create({ configPath });

    const dataPromise = new Promise<StreamingStore<Quad>>((resolve, reject) => {
      const store = new StreamingStore<Quad>();
      const quadStream = createReadStream(dataPath).pipe(new StreamParser());
      store.import(quadStream);
      quadStream.on('end', () => {
        resolve(store);
      });
      quadStream.on('error', error => {
        reject(error);
      });
    });

    return Promise.all([ queryEnginePromise, dataPromise ])
      .then(value => new QueryRunner(value[0], value[1], scenario, resultsPath));
  }

  public async run(): Promise<void> {
    // eslint-disable-next-line no-console
    console.log('Start run');
    // eslint-disable-next-line no-process-env
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Not in production mode!');
    }
    //
    // // Warmup
    // const warmupStream = await this.engine.queryBindings(this.scenario.queryString, { sources: [ this.store ]});
    // let count = 0;
    // warmupStream.on('data', () => {
    // count++;
    // });
    // await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    // warmupStream.destroy();
    // await new Promise<void>(resolve => setTimeout(() => resolve(), 100));
    // // eslint-disable-next-line no-console
    // console.log(`Warmup bindings count: ${count}`);
    //

    let numOfPosBindings = 0;
    let numOfTotBindings = 0;
    let firstResult: [number, number] | undefined;
    const start = process.hrtime();
    const bindingsStream = await this.engine.queryBindings(this.scenario.queryString, { sources: [ this.store ]});
    bindingsStream.on('error', error => {
      throw new error();
    });

    await new Promise<void>(resolve => {
      bindingsStream.on('data', (bindings: Bindings) => {
        if (firstResult === undefined) {
          firstResult = process.hrtime(start);
        }
        numOfTotBindings++;
        if (bindings.diff) {
          numOfPosBindings++;
          this.scenario.bindingHandler(bindings, this.store);
        }
        if (numOfTotBindings === 564) {
          resolve();
        }
      });
      bindingsStream.on('end', () => {
        resolve();
      });
    });

    const executionTime = process.hrtime(start);
    const memoryUsed = process.memoryUsage().heapUsed;
    // eslint-disable-next-line no-console
    console.log(`benchmark bindings count: ${numOfTotBindings}`);
    // eslint-disable-next-line no-console
    console.log(`first result: ${firstResult}`);

    const content = `${executionTime[0]},${executionTime[1]},${memoryUsed},${numOfPosBindings}\n`;
    await appendFile(this.resultsPath, content);
  }
}
