import type { Bindings } from '@incremunica/incremental-types';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { Operation } from '../Operation';

export class BatchOperation extends Operation {
  public constructor(driver: Driver,
    config: BenchmarkConfig,
    queryString: string,
    operationName: string) {
    super(driver,
      config,
      false,
      queryString,
      operationName);
  }

  protected _transform(bindings: Bindings): void {
    throw new Error(`${this.operationName} is not a transformation operation, _transform() should not be called. Is transformation set to false?`);
  }
}
