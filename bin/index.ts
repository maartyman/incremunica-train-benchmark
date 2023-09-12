import {QueryRunner} from "../lib/QueryRunner";
import {BatchConnectedSegments} from "../lib/operations/batch/BatchConnectedSegments";

async function run(): Promise<void> {

  //make result file

  const queryRunner = await QueryRunner.setupQueryRunner(
    {
      matchTransformPercentage: 20,
      randomSeed: "incremunica",
      queryEngineConfig: "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/full-hash-join/config.json",
      dataPath: "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/models/railway-inject-1-inferred.ttl",
      operationCreators: [
        BatchConnectedSegments.operationCreator
      ],
      resultsPath: "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/results/resultsTest.csv",
      numberOfTransforms: 5
    },
  );

  await queryRunner.run();
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
