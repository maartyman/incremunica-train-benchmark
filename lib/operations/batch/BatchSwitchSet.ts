import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { BatchOperation } from './BatchOperation';

export class BatchSwitchSet extends BatchOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?semaphore ?route ?swP ?sw ?currentPosition ?position
WHERE
{
    ?route base:entry ?semaphore .
    ?route rdf:type base:Route .
    ?route base:active true .
    ?semaphore rdf:type base:Semaphore .

    ?route base:follows ?swP .
    ?swP rdf:type base:SwitchPosition .

    ?swP base:target ?sw .
    ?sw rdf:type base:Switch .

    ?semaphore base:signal base:SIGNAL_GO .
    ?sw base:currentPosition ?currentPosition .
    ?swP base:position ?position .

    FILTER (?currentPosition != ?position)
}
`,
      'batch switch set',
    );
  }
}
