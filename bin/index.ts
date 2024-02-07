import {QueryRunner} from "../lib/QueryRunner";
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {BenchmarkConfig} from "../lib/Types";
import {Worker, isMainThread, parentPort, workerData} from 'worker_threads';

function getJoinConfigPath(basePathName: string, joinName: string) {
  switch (joinName) {
    case "computational-bind-join":
      return basePathName + "computational-bind-join/config.json";
    case "delta-query":
      return basePathName + "delta-query/config.json";
    case "full-hash-join":
      return basePathName + "full-hash-join/config.json";
    case "memory-bind-join":
      return basePathName + "memory-bind-join/config.json";
    case "nestedloop-join":
      return basePathName + "nestedloop-join/config.json";
    case "partial-hash-join":
      return basePathName + "partial-hash-join/config.json";
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

    let benchmarkFile = await new Promise<any>((resolve, reject) => {
      fs.readFile(
        benchmarkConfigsFilePath,
        'utf8',
        (error, data) => {
          if(error){
            reject(error);
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
    });

    for (const configFile of benchmarkFile.benchmarkConfigs) {
      let configFileName = configFile.joinAlgorithm + "_" + new Date().toUTCString() + "-" + new Date().getSeconds() + "," + new Date().getMilliseconds() + ".json";

      let resultPath = benchmarkFile.commonConfig.baseResultPath + uuidv4() + ".csv";

      let benchmarkConfig: BenchmarkConfig = {
        matchTransformPercentage: configFile.matchTransformPercentage,
        randomSeed: benchmarkFile.commonConfig.randomSeed,
        queryEngineConfig: getJoinConfigPath(benchmarkFile.commonConfig.baseIncremunicaConfigPath, configFile.joinAlgorithm),
        dataPath: configFile.dataPath,
        operationStings: configFile.operationStings,
        resultsPath: resultPath,
        numberOfTransforms: configFile.numberOfTransforms,
        runNr: -1
      };

      //save benchmark config
      try {fs.mkdirSync(benchmarkFile.commonConfig.baseConfigPath) } catch (e) {}
      fs.writeFileSync(benchmarkFile.commonConfig.baseConfigPath + configFileName, JSON.stringify(benchmarkConfig));

      try { fs.rmSync(benchmarkFile.commonConfig.baseConfigPath + 'latest', {recursive: true}) } catch (e) {}
      try { fs.mkdirSync(benchmarkFile.commonConfig.baseConfigPath + 'latest') } catch (e) {}
      fs.writeFileSync(benchmarkFile.commonConfig.baseConfigPath + 'latest/' + configFileName,JSON.stringify(benchmarkConfig, undefined, "\n"));

      try {fs.mkdirSync(benchmarkFile.commonConfig.baseResultPath) } catch (e) {}
      fs.writeFileSync(resultPath, QueryRunner.BuildCSVHeader(benchmarkConfig));

      //warmupRound
      try {
        const worker = new Worker(__filename, {
          workerData: benchmarkConfig
        });

        await new Promise<void>((resolve, reject) => {
          worker.once('message', () => {
            resolve();
          });
          worker.on("error", (err: any) => {
            reject(err);
          });
          worker.on("exit", () => {
            resolve();
          });
        });
      } catch (e) {
        console.log(e);
        continue;
      }

      for (let i = 0; i < configFile.numberOfRuns; i++) {
        try {
          benchmarkConfig.runNr = i;

          const worker = new Worker(__filename, {
            workerData: benchmarkConfig,
          });

          await new Promise<void>((resolve, reject) => {
            worker.once('message', () => {
              resolve();
            })
            worker.on("error", (err: any) => {
              reject(err);
            });
            worker.on("exit", () => {
              resolve();
            });
            setTimeout(() => {
              resolve();
            }, 30*60000);
          });
        } catch (e) {
          console.log(e);
        }
      }
    }
  } else {
    console.log('Run');

    let benchmarkConfig: BenchmarkConfig = workerData;
    console.log(JSON.stringify(benchmarkConfig));

    const queryRunner = await QueryRunner.setupQueryRunner(benchmarkConfig);

    await queryRunner.run();

    if (parentPort === null) throw new Error('parentPort is null');
    parentPort.postMessage('');
    process.exit()
  }
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
