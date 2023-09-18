import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { REQUIRES } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class RepairRouteSensor extends TransformationOperation {
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
      'repair route sensor',
    );
  }

  protected _transform(bindings: Bindings): void {
    const route = this.getSafe(bindings, 'route');
    const sensor = this.getSafe(bindings, 'sensor');

    this.driver.streamingStore.addQuad(new Quad(
      route,
      REQUIRES,
      sensor,
      undefined,
    ));
  }
}
