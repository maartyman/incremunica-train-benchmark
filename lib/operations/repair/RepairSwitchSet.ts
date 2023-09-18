import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { CURRENTPOSITION } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class RepairSwitchSet extends TransformationOperation {
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
      'repair switch set',
    );
  }

  protected _transform(bindings: Bindings): void {
    const sw = this.getSafe(bindings, 'sw');

    this.driver.streamingStore.removeQuad(new Quad(
      sw,
      CURRENTPOSITION,
      this.getSafe(bindings, 'currentPosition'),
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      sw,
      CURRENTPOSITION,
      this.getSafe(bindings, 'position'),
      undefined,
    ));
  }
}
