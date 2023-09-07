import {QueryRunner} from "../lib/QueryRunner";
import {InjectPosLengthScenario, BatchPosLengthScenario} from "../lib/scenarios/Scenarios";

async function run(): Promise<void> {

  let scenario = new InjectPosLengthScenario();

  const queryRunner = await QueryRunner.setupQueryRunner(
    "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/configs/computational-bind-join/config.json",
    "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/data/models/railway-inject-1-inferred.ttl",
    scenario,
    "/home/maarten/Documents/doctoraat/code/incremunica-trainbench/results/resultsTest.csv"
  );

  await queryRunner.run();
}

run().then(() => {
  console.log('Finished');
}).catch(error => {
  throw error;
});
