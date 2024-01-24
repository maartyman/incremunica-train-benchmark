import { QueryEngineFactory } from '@comunica/query-sparql-rdfjs';
import { BindingsFactory } from '@incremunica/incremental-bindings-factory';
import type { Bindings, BindingsStream, Quad } from '@incremunica/incremental-types';
import type { Term } from 'n3';
import seedrandom = require('seedrandom');
import { HashBindings } from '../../../incremunica/packages/hash-bindings';
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

  private readonly config: BenchmarkConfig;

  private readonly hashBindings = new HashBindings();

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

  public flush(): void {
    this.streamingStore.flush();
  }

  public async query(): Promise<void> {
    await new Promise<void>(async resolve => {
      if (this.bindingsStream === undefined) {
        this.bindingsStream = <BindingsStream> await this.driver.queryEngine.queryBindings(
          this.queryString,
          {
            sources: [ this.streamingStore ],
          },
        );
      }

      this.bindingsStream.on('data', (bindings: Bindings) => {
        // Console.log('data')
        const hash = this.hashBindings.hash(bindings);

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
      });

      this.bindingsStream.once('up-to-date', () => {
        this.bindingsStream?.removeAllListeners('data');
        resolve();
      });
    });

    const engine = await new QueryEngineFactory().create();
    const bindingsStream = await engine.queryBindings(
      this.queryString,
      {
        sources: [ this.driver.streamingStore.getStore() ],
      },
    );

    const changeBindingsMap = new Map<string, number>();
    for (const key of this.bindingsMap.keys()) {
      changeBindingsMap.set(key, -1);
    }

    bindingsStream.on('data', (bindings: Bindings) => {
      const hash = this.hashBindings.hash(bindings);
      if (changeBindingsMap.has(hash)) {
        changeBindingsMap.delete(hash);
      } else {
        changeBindingsMap.set(hash, 1);
      }
    });

    await new Promise<void>(resolve => bindingsStream.on('end', () => resolve()));

    if (changeBindingsMap.size > 0) {
      throw new Error(`Materialized result not complete, amount of faults: ${changeBindingsMap.size}`);
    }

    // Console.log(this.operationName, 'number of total results:', this.bindingsMap.size);
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
        if (this.hashBindings.hash(bindings1) < this.hashBindings.hash(bindings2)) {
          return -1;
        }
        if (this.hashBindings.hash(bindings1) > this.hashBindings.hash(bindings2)) {
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
