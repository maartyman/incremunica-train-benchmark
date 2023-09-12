import { Operation } from './Operation';
import {Driver} from "../Driver";
import {BenchmarkConfig} from "../Types";

export class TransformationOperation extends Operation {
  constructor(driver: Driver,
              config: BenchmarkConfig,
              queryString: string,
              operationName: string) {
    super(driver,
      config,
      queryString,
      operationName,
      true);
  }
}
