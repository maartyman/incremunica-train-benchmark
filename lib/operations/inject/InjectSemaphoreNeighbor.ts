import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { ENTRY } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectSemaphoreNeighbor extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?route ?semaphore
WHERE {
    ?route rdf:type base:Route .
    ?route base:entry ?semaphore .
    ?semaphore rdf:type base:Semaphore .
}
`,
      'inject semaphore neighbor',
    );
  }

  protected _transform(bindings: Bindings): void {
    this.driver.streamingStore.removeQuad(new Quad(
      this.getSafe(bindings, 'route'),
      ENTRY,
      this.getSafe(bindings, 'semaphore'),
      undefined,
    ));
  }
}
