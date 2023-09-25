import {QueryRunner} from "../lib/QueryRunner";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {BenchmarkConfig} from "../lib/Types";
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

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

async function run(): Promise<void> {
  if (isMainThread) {
    //get config from file
    let benchmarkConfigsFilePath: string = "";
    for (let i = 0; i < process.argv.length; i++) {
      if (process.argv[i] === "-f") {
        benchmarkConfigsFilePath = process.argv[i+1];
        break;
      }
    }
    if (benchmarkConfigsFilePath === "") throw new Error('benchmarkConfigsFilePath not specified, add -f tag!');

    let benchmarkConfigs = await new Promise<any[]>((resolve, reject) => {
      fs.readFile(
        benchmarkConfigsFilePath,
        'utf8',
        (error, data) => {
          if(error){
            reject(error);
          }
          try {
            resolve(JSON.parse(data).benchmarkConfigs);
          } catch (error) {
            reject(error);
          }
        });
    });

    for (const configFile of benchmarkConfigs) {
      let configFileName = configFile.joinAlgorithm + "_" + new Date().toUTCString() + "-" + new Date().getSeconds() + "," + new Date().getMilliseconds() + ".json";

      let resultPath = configFile.baseResultPath + uuidv4() + ".csv";

      let benchmarkConfig: BenchmarkConfig = {
        matchTransformPercentage: configFile.matchTransformPercentage,
        randomSeed: configFile.randomSeed,
        queryEngineConfig: getJoinConfigPath(configFile.joinAlgorithm),
        dataPath: configFile.dataPath,
        cachedResultsBasePath: configFile.cachedResultsBasePath,
        operationStings: configFile.operationStings,
        resultsPath: resultPath,
        numberOfTransforms: configFile.numberOfTransforms,
        runNr: -1
      };

      //save benchmark config
      try {fs.mkdirSync(configFile.baseConfigPath) } catch (e) {}
      fs.writeFileSync(configFile.baseConfigPath + configFileName, JSON.stringify(configFile));

      try { fs.rmSync(configFile.baseConfigPath + 'latest', {recursive: true}) } catch (e) {}
      try { fs.mkdirSync(configFile.baseConfigPath + 'latest') } catch (e) {}
      fs.writeFileSync(configFile.baseConfigPath + 'latest/' + configFileName,JSON.stringify(configFile, undefined, "\n"));

      try {fs.mkdirSync(configFile.baseResultPath) } catch (e) {}
      fs.writeFileSync(resultPath, QueryRunner.BuildCSVHeader(configFile));

      //warmupRound
      const worker = new Worker(__filename, {
        workerData: benchmarkConfig
      });

      await new Promise<void>((resolve) => worker.once('message', () => {
        resolve();
      }));

      for (let i = 0; i < configFile.numberOfRuns; i++) {
        try {
          benchmarkConfig.runNr = i;

          const worker = new Worker(__filename, {
            workerData: benchmarkConfig
          });

          await new Promise<void>((resolve, reject) => {
            worker.once('message', () => {
              resolve();
            })
            worker.on("error", (err: any) => {
              reject(err);
            });
          });
        } catch (e) {
          break;
        }
      }
    }
  } else {
    console.log('Run');

    let benchmarkConfig: BenchmarkConfig = workerData;

    const queryRunner = await QueryRunner.setupQueryRunner(benchmarkConfig);

    await queryRunner.run();

    parentPort.postMessage('');
    process.exit()
  }
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
