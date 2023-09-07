import type { StreamingStore } from '@incremunica/incremental-rdf-streaming-store';
import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import type { Term } from 'n3';
import { DataFactory } from 'n3';
import { LENGTHTERM } from '../../BenchmarkTerms';
import type { IScenario } from '../IScenario';
import literal = DataFactory.literal;

export class InjectPosLengthScenario implements IScenario {
  public name = 'inject positive length scenario';
  public queryString = `PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?segment
WHERE {
    ?segment rdf:type base:Segment .
}`;

  public bindingHandler(bindings: Bindings, store: StreamingStore<Quad>): void {
    const segment = bindings.get('segment');
    if (!segment) {
      return;
    }

    const quad = store.getStore().readQuads(
      segment,
      LENGTHTERM,
      null,
      null,
    )[Symbol.iterator]().next().value;

    if (!quad) {
      return;
    }

    store.removeQuad(quad);

    store.addQuad(new Quad(
      <Term>segment,
      LENGTHTERM,
      literal(0),
      undefined,
    ));
  }
}
