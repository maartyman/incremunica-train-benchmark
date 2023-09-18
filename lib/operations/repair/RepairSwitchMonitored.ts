import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { NamedNode } from 'n3';
import { BASE_PREFIX, MONITORED_BY, RDF, SENSOR } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class RepairSwitchMonitored extends TransformationOperation {
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
      'repair switch monitored',
    );
  }

  protected _transform(bindings: Bindings): void {
    const sw = this.getSafe(bindings, 'sw');
    const id = this.driver.generateNewVertexId();
    const sensor = new NamedNode(`${BASE_PREFIX}_${id}`);

    this.driver.streamingStore.addQuad(new Quad(
      sw,
      MONITORED_BY,
      sensor,
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      sw,
      RDF.type,
      SENSOR,
      undefined,
    ));
  }
}
