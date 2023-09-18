import { QueryEngine } from '@comunica/query-sparql-rdfjs';
import type { Bindings, BindingsStream } from '@incremunica/incremental-types';
import type { Term } from 'n3';
import seedrandom = require('seedrandom');
import type { Driver } from '../Driver';
import type { BenchmarkConfig } from '../Types';
import {DevTools} from "@incremunica/dev-tools";

export class Operation {
  public readonly queryString: string;

  public readonly transformation: boolean;

  public readonly operationName: string;

  protected driver: Driver;

  private bindingsStream: BindingsStream | undefined;

  private readonly bindingsMap = new Map<string, Bindings>();

  private changeBindingsMap = new Map<string, boolean>();

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
            sources: [ this.driver.streamingStore ],
          },
        );
      }

      this.readFromBindingsStream(resolve);
      this.bindingsStream.on('readable', () => this.readFromBindingsStream(resolve));
    });

    console.log(this.operationName, 'number of total results:', this.bindingsMap.size);
  }

  private readFromBindingsStream(resolve: (value: (void | PromiseLike<void>)) => void): void {
    let bindings = this.bindingsStream!.read();
    while (bindings) {
      const hash = Operation.bindingsHash(bindings);
      const change = this.changeBindingsMap.get(hash);

      /*
      if (!this.transformation) {
        DevTools.printBindings(bindings);
      }
       */

      if (change !== undefined && (change === bindings.diff)) {
        this.changeBindingsMap.delete(hash);
      }
      if (bindings.diff) {
        this.bindingsMap.set(hash, bindings);
      } else {
        this.bindingsMap.delete(hash);
      }
      if (this.changeBindingsMap.size === 0) {
        this.bindingsStream!.removeAllListeners('readable');
        resolve();
      }
      bindings = this.bindingsStream!.read();
    }
  }

  public async calculateNumberOfResults(): Promise<void> {
    const engine = new QueryEngine();
    const bindingsStream = await engine.queryBindings(
      this.queryString,
      {
        sources: [ this.driver.streamingStore.getStore() ],
      },
    );

    this.changeBindingsMap = new Map<string, boolean>();
    for (const key of this.bindingsMap.keys()) {
      this.changeBindingsMap.set(key, false);
    }

    bindingsStream.on('data', (bindings: Bindings) => {
      const hash = Operation.bindingsHash(bindings);
      if (this.changeBindingsMap.has(hash)) {
        this.changeBindingsMap.delete(hash);
      } else {
        this.changeBindingsMap.set(hash, true);
      }
    });

    await new Promise<void>(resolve => bindingsStream.on('end', () => resolve()));

    /*
    if (!this.transformation) {
      for (const [key, value] of this.changeBindingsMap) {
        console.log(key, value);
      }
    }
     */

    console.log(this.operationName, 'number of new results:', this.changeBindingsMap.size);
  }

  public async transform(): Promise<void> {
    // If (!this.driver.streamingStore.isHalted()) {
    //  throw new Error('StreamingStore hasn\'t been halted');
    // }
    await this.query();

    const bindings: Bindings[] = this.getTransformMatches();

    console.log(this.operationName, 'bindings transform length', bindings.length);
    bindings.forEach(this._transform.bind(this));
  }

  protected _transform(bindings: Bindings): void {
    throw new Error(`${this.operationName} does not overwrite '_transform()'.`);
  }

  private getTransformMatches(): Bindings[] {
    seedrandom(this.config.randomSeed, { global: true });
    const size = Math.floor(this.config.matchTransformPercentage / 100 * this.bindingsMap.size);

    let bindings = [ ...this.bindingsMap.values()].sort((bindings1: Bindings, bindings2: Bindings) => {
      if (Operation.bindingsHash(bindings1) < Operation.bindingsHash(bindings2)) {
        return -1;
      }
      if (Operation.bindingsHash(bindings1) > Operation.bindingsHash(bindings2)) {
        return 1;
      }
      return 0;
    }).slice(0, size);

    for (let i = bindings.length; i > 1; i--) {
      const temp = bindings[this.nextInt(i)];
      bindings[this.nextInt(i)] = bindings[i - 1];
      bindings[i - 1] = temp;
    }

    return bindings;
  }

  private nextInt(int: number): number {
    return Math.floor(Math.random() * int);
  }

  protected getSafe(bindings: Bindings, variable: string): Term {
    const term = <Term>bindings.get(variable);
    if (term === undefined) {
      throw new Error(`${this.operationName} specified variable: ${variable}`);
    }
    return term;
  }
}
