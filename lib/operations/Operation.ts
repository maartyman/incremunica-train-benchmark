import type { Bindings, BindingsStream } from '@incremunica/incremental-types';
import type { Term } from 'n3';
import seedrandom = require('seedrandom');
import type { Driver } from '../Driver';
import type { BenchmarkConfig } from '../Types';

export class Operation {
  public readonly queryString: string;
  public readonly transformation: boolean;
  public readonly operationName: string;
  protected driver: Driver;
  private bindingsStream: BindingsStream | undefined;
  private bindingsMap = new Map<string, Bindings>();
  private readonly config: BenchmarkConfig;

  public constructor(
    driver: Driver,
    config: BenchmarkConfig,
    queryString: string = '',
    operationName: string = '',
    transformation: boolean | undefined = undefined
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

  public static operationCreator(driver: Driver, config: BenchmarkConfig): Operation {
    return new Operation(driver, config);
  }

  public static bindingsHash(bindings: Bindings): string {
    let hash = '';
    for (const binding of bindings) {
      hash += `${binding[0].value}:${binding[1].value}#`;
    }
    return hash;
  }

  public async query(numberOfResults?: number): Promise<void> {
    if (this.transformation === true) {
      const bindingsStream = await this.driver.queryEngine.queryBindings(
        this.queryString,
        {
          sources: [ this.driver.streamingStore.getStore() ],
        },
      );

      bindingsStream.on('data', (bindings: Bindings) => {
        if (bindings.diff) {
          this.bindingsMap.set(Operation.bindingsHash(bindings), bindings);
        } else {
          this.bindingsMap.delete(Operation.bindingsHash(bindings));
        }
      });

      await new Promise<void>(resolve => bindingsStream.on('end', () => resolve()));
    } else if (this.transformation === false) {
      await new Promise<void>(async resolve => {
        this.bindingsStream = <BindingsStream> await this.driver.queryEngine.queryBindings(
          this.queryString,
          {
            sources: [ this.driver.streamingStore ],
          },
        );

        this.bindingsStream.on('data', bindings => {
          if (numberOfResults === undefined) {
            throw new Error('numberOfResults not set!');
          }
          if (bindings.diff) {
            numberOfResults--;
            this.bindingsMap.set(Operation.bindingsHash(bindings), bindings);
          } else {
            numberOfResults++;
            this.bindingsMap.delete(Operation.bindingsHash(bindings));
          }
          if (numberOfResults === 0) {
            this.bindingsStream?.removeAllListeners();
            resolve();
          }
        });
      });
    }
  }

  public async transform(): Promise<void> {
    if (!this.driver.streamingStore.isHalted()) {
      throw new Error('StreamingStore ahsn\'t been halted');
    }
    this.bindingsMap = new Map<string, Bindings>();
    await this.query();

    const bindings: Bindings[] = this.getTransformMatches();

    bindings.forEach(this._transform.bind(this));
  }

  protected _transform(bindings: Bindings): void {
    throw new Error(`${this.operationName} does not overwrite '_transform()'.`);
  }

  private getTransformMatches(): Bindings[] {
    seedrandom(this.config.randomSeed, { global: true });
    const size = Math.floor(this.config.matchTransformPercentage / 100 * this.bindingsMap.size);
    const bindings = [ ...this.bindingsMap.values() ].slice(0, size);

    bindings.sort();

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
