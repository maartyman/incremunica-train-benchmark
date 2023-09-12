import type { Bindings } from '@incremunica/incremental-types';
import { Operation } from '../Operation';
import {Driver} from "../../Driver";
import {BenchmarkConfig} from "../../Types";

export class BatchOperation extends Operation {
  constructor(driver: Driver,
              config: BenchmarkConfig,
              queryString: string,
              operationName: string) {
    super(driver,
      config,
      queryString,
      operationName,
      false);
  }

  protected _transform(bindings: Bindings): void {
    throw new Error(`${this.operationName} is not a transformation operation, _transform() should not be called. Is transformation set to false?`);
  }
}
