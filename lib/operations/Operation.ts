import * as fs from 'fs';
import { QueryEngineFactory } from '@comunica/query-sparql-rdfjs';
import { BindingsFactory } from '@incremunica/incremental-bindings-factory';
import type { Bindings, BindingsStream, Quad } from '@incremunica/incremental-types';
import type { Term } from 'n3';
import seedrandom = require('seedrandom');
import { StreamingStore } from '../../../incremunica/packages/incremental-rdf-streaming-store';
import type { Driver } from '../Driver';
import type { BenchmarkConfig } from '../Types';

const BF = new BindingsFactory();

export class Operation {
  public readonly queryString: string;

  public readonly transformation: boolean;

  public readonly operationName: string;

  protected driver: Driver;

  protected streamingStore: StreamingStore<Quad>;

  private bindingsStream: BindingsStream | undefined;

  private readonly bindingsMap = new Map<string, { bindings: Bindings; count: number }>();

  private changeBindingsMap = new Map<string, number>();

  private readonly config: BenchmarkConfig;

  public constructor(
    driver: Driver,
    config: BenchmarkConfig,
    transformation: boolean,
    queryString = '',
    operationName = '',
  ) {
    this.driver = driver;
    this.config = config;

    this.streamingStore = new StreamingStore<Quad>();

    for (const quad of driver.streamingStore.getStore()) {
      this.streamingStore.addQuad(<Quad>quad);
    }
    this.streamingStore.halt();
    this.streamingStore.import(this.driver.streamingStore.match());

    if (queryString === '') {
      throw new Error(`${this.operationName} does not overwrite 'queryString'`);
    }
    this.queryString = queryString;
    if (transformation === undefined) {
      throw new Error(`${this.operationName} does not overwrite 'transformation'`);
    }
    this.transformation = transformation;
    if (operationName === '') {
      throw new Error(`${this.operationName} does not overwrite 'operationName'`);
    }
    this.operationName = operationName;
  }

  public resume(): void {
    this.streamingStore.resume();
  }

  public halt(): void {
    this.streamingStore.halt();
  }

  public static bindingsHash(bindings: Bindings): string {
    const hash = [];
    for (const binding of bindings) {
      hash.push(`${binding[0].value}:${binding[1].value}#`);
    }
    return hash.sort((string1, string2) => {
      if (string1 < string2) {
        return -1;
      }
      if (string1 > string2) {
        return 1;
      }
      return 0;
    }).join(',');
  }

  public async query(): Promise<void> {
    if (this.changeBindingsMap.size === 0) {
      return;
    }
    await new Promise<void>(async resolve => {
      if (this.bindingsStream === undefined) {
        this.bindingsStream = <BindingsStream> await this.driver.queryEngine.queryBindings(
          this.queryString,
          {
            sources: [ this.streamingStore ],
          },
        );
      }

      this.readFromBindingsStream(resolve);
      this.bindingsStream.on('readable', () => this.readFromBindingsStream(resolve));
    });

    // Console.log(this.operationName, 'number of total results:', this.bindingsMap.size);
  }

  private readFromBindingsStream(resolve: (value: (void | PromiseLike<void>)) => void): void {
    let bindings = this.bindingsStream!.read();
    while (bindings) {
      const hash = Operation.bindingsHash(bindings);
      const change = this.changeBindingsMap.get(hash);

      if (change === undefined) {
        this.changeBindingsMap.set(hash, bindings.diff ? -1 : 1);
      } else {
        const newChange = change + (bindings.diff ? -1 : 1);
        if (newChange === 0) {
          this.changeBindingsMap.delete(hash);
        } else {
          this.changeBindingsMap.set(hash, newChange);
        }
      }

      const bindingsData = this.bindingsMap.get(hash);
      if (bindings.diff) {
        if (bindingsData) {
          bindingsData.count++;
          if (bindingsData.count === 0) {
            this.bindingsMap.delete(hash);
          }
        } else {
          this.bindingsMap.set(hash, { bindings, count: 1 });
        }
      } else if (bindingsData) {
        bindingsData.count--;
        if (bindingsData.count === 0) {
          this.bindingsMap.delete(hash);
        }
      } else {
        this.bindingsMap.set(hash, { bindings, count: -1 });
      }
      if (this.changeBindingsMap.size === 0) {
        this.bindingsStream!.removeAllListeners('readable');
        resolve();
      }

      // If (this.operationName === 'repair connected segments' && this.changeBindingsMap.size < 100) {
      // console.log("split");
      // for (const [key, value] of this.changeBindingsMap) {
      // console.log(key, value);
      // }
      // }

      bindings = this.bindingsStream!.read();
    }
  }

  public async calculateNumberOfResults(cachedResults: any, runNum: number): Promise<void> {
    const changeBindingsMap = cachedResults[this.operationName + runNum.toString()];
    if (changeBindingsMap) {
      for (let i = 0; i < 100; i++) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1));
      }
      this.changeBindingsMap = new Map(Object.entries(changeBindingsMap));
    } else {
      const engine = await new QueryEngineFactory().create();
      const bindingsStream = await engine.queryBindings(
        this.queryString,
        {
          sources: [ this.driver.streamingStore.getStore() ],
        },
      );

      this.changeBindingsMap = new Map<string, number>();
      for (const key of this.bindingsMap.keys()) {
        this.changeBindingsMap.set(key, -1);
      }

      bindingsStream.on('data', (bindings: Bindings) => {
        const hash = Operation.bindingsHash(bindings);
        if (this.changeBindingsMap.has(hash)) {
          this.changeBindingsMap.delete(hash);
        } else {
          this.changeBindingsMap.set(hash, 1);
        }
      });

      await new Promise<void>(resolve => bindingsStream.on('end', () => resolve()));

      const cachedResultsMap = new Map<string, number>();
      for (const [ key, value ] of this.changeBindingsMap) {
        cachedResultsMap.set(key, value);
      }

      cachedResults[this.operationName + runNum.toString()] = Object.fromEntries(cachedResultsMap.entries());

      await new Promise<void>(resolve => fs.writeFile(
        cachedResults.cachedResultsFilePath,
        JSON.stringify(cachedResults),
        () => {
          resolve();
        },
      ));
    }

    //
    // if (this.operationName === 'repair connected segments') {
    // for (const [key, value] of this.changeBindingsMap) {
    //     console.log(key, value);
    // }
    // }
    //

    // console.log(this.operationName, 'number of new results:', this.changeBindingsMap.size);
  }

  public async transform(): Promise<void> {
    await this.query();

    if (!this.streamingStore.isHalted()) {
      throw new Error('StreamingStore hasn\'t been halted');
    }

    const bindings: Bindings[] = this.getTransformMatches();

    // Console.log(this.operationName, 'bindings transform length', bindings.length);
    bindings.forEach(this._transform.bind(this));
  }

  protected _transform(bindings: Bindings): void {
    throw new Error(`${this.operationName} does not overwrite '_transform()'.`);
  }

  private getTransformMatches(): Bindings[] {
    const rng = seedrandom(this.config.randomSeed);
    const size = Math.floor(this.config.matchTransformPercentage / 100 * this.bindingsMap.size);

    const bindings = [ ...this.bindingsMap.values() ]
      .map(values => values.bindings)
      .sort((bindings1: Bindings, bindings2: Bindings) => {
        if (Operation.bindingsHash(bindings1) < Operation.bindingsHash(bindings2)) {
          return -1;
        }
        if (Operation.bindingsHash(bindings1) > Operation.bindingsHash(bindings2)) {
          return 1;
        }
        return 0;
      }).slice(0, size);

    for (let i = bindings.length; i > 1; i--) {
      const int = Math.floor(rng() * bindings.length);
      const temp = bindings[int];
      bindings[int] = bindings[i - 1];
      bindings[i - 1] = temp;
    }

    return bindings;
  }

  protected getSafe(bindings: Bindings, variable: string): Term {
    const term = <Term>bindings.get(variable);
    if (term === undefined) {
      throw new Error(`${this.operationName} specified variable: ${variable}`);
    }
    return term;
  }
}
