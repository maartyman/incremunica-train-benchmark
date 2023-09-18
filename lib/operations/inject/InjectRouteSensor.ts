import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { REQUIRES } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectRouteSensor extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?route ?sensor
WHERE {
    ?route base:requires ?sensor .
    ?route rdf:type base:Route .
    ?sensor rdf:type base:Sensor .
}
`,
      'inject route sensor',
    );
  }

  protected _transform(bindings: Bindings): void {
    this.driver.streamingStore.removeQuad(new Quad(
      this.getSafe(bindings, 'route'),
      REQUIRES,
      this.getSafe(bindings, 'sensor'),
      undefined,
    ));
  }
}
