import {QueryRunner} from "../lib/QueryRunner";
import {BatchConnectedSegments} from "../lib/operations/batch/BatchConnectedSegments";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {BenchmarkConfig} from "../lib/Types";

function getJoinConfigPath(joinName: string) {
  switch (joinName) {
    case "computational-bind-join":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/computational-bind-join/config.json";
    case "delta-query":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/delta-query/config.json";
    case "full-hash-join":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/full-hash-join/config.json";
    case "memory-bind-join":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/memory-bind-join/config.json";
    case "nestedloop-join":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/nestedloop-join/config.json";
    case "partial-hash-join":
      return "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/partial-hash-join/config.json";
  }
  throw new Error(`join algorithm:${joinName} doesn't exist`);
}

let baseResultPath = '/home/maarten/Documents/doctoraat/code/incremunica-trainbench/results/resultsData/';
let baseConfigPath = '/home/maarten/Documents/doctoraat/code/incremunica-trainbench/results/benchmarkConfigs/';

async function run(): Promise<void> {
  console.log('Run');

  let joinAlgorithm = "partial-hash-join";

  //make result file
  let resultPath = baseResultPath + uuidv4() + ".csv";
  let benchmarkConfig: BenchmarkConfig = {
    matchTransformPercentage: 100,
    randomSeed: "incremunica",
    queryEngineConfig: getJoinConfigPath(joinAlgorithm),
    dataPath: "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/models/railway-inject-1-inferred.ttl",
    operationStings: [
      'BatchConnectedSegments',
      'BatchPosLength',
      'BatchRouteSensor',
      'BatchSemaphoreNeighbor',
      'BatchSwitchMonitored',
      'BatchSwitchSet',

      'InjectConnectedSegments',
      'InjectPosLength',
      'InjectRouteSensor',
      'InjectSemaphoreNeighbor',
      'InjectSwitchMonitored',
      'InjectSwitchSet',

      'RepairConnectedSegments',
      'RepairPosLength',
      'RepairRouteSensor',
      'RepairSemaphoreNeighbor',
      'RepairSwitchMonitored',
      'RepairSwitchSet',
    ],
    resultsPath: resultPath,
    numberOfTransforms: 3
  };

  let configFileName = joinAlgorithm + "_" + new Date().toUTCString() + "-" + new Date().getSeconds() + "," + new Date().getMilliseconds() + ".json";

  //save benchmark config
  try {fs.mkdirSync(baseConfigPath) } catch (e) {}
  fs.writeFileSync(baseConfigPath + configFileName, JSON.stringify(benchmarkConfig));

  try { fs.rmSync(baseConfigPath + 'latest', {recursive: true}) } catch (e) {}
  try { fs.mkdirSync(baseConfigPath + 'latest') } catch (e) {}
  fs.writeFileSync(baseConfigPath + 'latest/' + configFileName,JSON.stringify(benchmarkConfig, undefined, "\n"));

  try {fs.mkdirSync(baseResultPath) } catch (e) {}
  fs.writeFileSync(resultPath, QueryRunner.BuildCSVHeader(benchmarkConfig));


  const queryRunner = await QueryRunner.setupQueryRunner(benchmarkConfig);

  await queryRunner.run();
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
