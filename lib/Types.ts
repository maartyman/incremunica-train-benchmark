import type { Driver } from './Driver';
import type { Operation } from './operations/Operation';

export type Time = [number, number];
export interface BenchmarkConfig {
  operationCreators: ((driver: Driver, config: BenchmarkConfig) => Operation)[];
  matchTransformPercentage: number;
  numberOfTransforms: number;
  randomSeed: string;
  queryEngineConfig: string;
  dataPath: string;
  resultsPath: string;
}
