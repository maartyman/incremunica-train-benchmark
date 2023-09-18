import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { BatchOperation } from './BatchOperation';

export class BatchSemaphoreNeighbor extends BatchOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?semaphore ?route1 ?route2 ?sensor1 ?sensor2 ?te1 ?te2
WHERE
{
    ?route1 base:exit ?semaphore .
    ?route1 rdf:type base:Route .
    ?semaphore rdf:type base:Semaphore .

    ?route1 base:requires ?sensor1 .
    ?sensor1 rdf:type base:Sensor .

    ?te1 base:monitoredBy ?sensor1 .
    ?te1 rdf:type base:TrackElement .

    ?te1 base:connectsTo ?te2 .
    ?te2 rdf:type base:TrackElement .

    ?te2 base:monitoredBy ?sensor2 .
    ?sensor2 rdf:type base:Sensor .

    ?route2 base:requires ?sensor2 .

    FILTER (?route1 != ?route2) .

    FILTER NOT EXISTS {
        ?route2 base:entry ?semaphore
    }
}
`,
      'batch semaphore neighbor',
    );
  }
}
