import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { BatchOperation } from './BatchOperation';

export class BatchSwitchMonitored extends BatchOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?sw
WHERE
{
    ?sw rdf:type base:Switch .

    FILTER NOT EXISTS {
        ?sw base:monitoredBy ?sensor .
        ?sensor rdf:type base:Sensor .
    }
}
`,
      'batch switch monitored',
    );
  }
}
