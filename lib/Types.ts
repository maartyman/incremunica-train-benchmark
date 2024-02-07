export type Time = [number, number];
/* eslint @typescript-eslint/consistent-type-definitions: ["error", "type"] */
export type BenchmarkConfig = {
  operationStings: string[];
  matchTransformPercentage: number;
  numberOfTransforms: number;
  randomSeed: string;
  queryEngineConfig: string;
  dataPath: string;
  resultsPath: string;
  runNr: number;
};
