import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { DataFactory } from 'n3';
import { LENGTH } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectPosLength extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?segment
WHERE {
    ?segment rdf:type base:Segment .
}
`,
      'inject pos length',
    );
  }

  protected _transform(bindings: Bindings): void {
    const segment = this.getSafe(bindings, 'segment');

    const quads = this.driver.streamingStore.getStore().getQuads(
      segment,
      LENGTH,
      null,
      null,
    );
    if (quads.length === 0) {
      return;
    }

    this.driver.streamingStore.removeQuad(quads[0]);

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      LENGTH,
      DataFactory.literal(0),
      undefined,
    ));
  }
}
