import type { StreamingStore } from '@incremunica/incremental-rdf-streaming-store';
import type { Bindings, Quad } from '@incremunica/incremental-types';
import { DataFactory } from 'n3';
import type { IScenario } from '../IScenario';
import literal = DataFactory.literal;

export class BatchPosLengthScenario implements IScenario {
  public name = 'batch positive length scenario';
  public queryString = `PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?segment
WHERE {
    ?segment rdf:type base:Segment .
}`;

  public bindingHandler(bindings: Bindings, store: StreamingStore<Quad>): void {
    store.end();
  }
}
