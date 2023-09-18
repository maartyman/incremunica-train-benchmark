import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { CURRENTPOSITION } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import { Position } from '../../PositionUtils';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectSwitchSet extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?sw
WHERE {
    ?sw rdf:type base:Switch .
}
`,
      'inject switch set',
    );
  }

  protected _transform(bindings: Bindings): void {
    const sw = this.getSafe(bindings, 'sw');

    const quads = this.driver.streamingStore.getStore().getQuads(
      sw,
      CURRENTPOSITION,
      null,
      null,
    );
    if (quads.length === 0) {
      return;
    }

    this.driver.streamingStore.removeQuad(quads[0]);

    const currentPosition = new Position(quads[0].object);

    currentPosition.incrementPosition();

    this.driver.streamingStore.addQuad(new Quad(
      sw,
      CURRENTPOSITION,
      currentPosition.toTerm(),
      undefined,
    ));
  }
}
