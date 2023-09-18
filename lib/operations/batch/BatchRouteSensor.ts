import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { BatchOperation } from './BatchOperation';

export class BatchRouteSensor extends BatchOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?route ?sensor ?swP ?sw
WHERE
{
    ?route base:follows ?swP .
    ?route rdf:type base:Route .
    ?swP rdf:type base:SwitchPosition .

    ?swP base:target ?sw .
    ?sw rdf:type base:Switch .

    ?sw base:monitoredBy ?sensor .
    ?sensor rdf:type base:Sensor .

    FILTER NOT EXISTS {
        ?route base:requires ?sensor .
    }
}
`,
      'batch route sensor',
    );
  }
}
