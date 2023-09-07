import type { StreamingStore } from '@incremunica/incremental-rdf-streaming-store';
import type { Bindings, Quad } from '@incremunica/incremental-types';

export interface IScenario {
  name: string;
  queryString: string;
  bindingHandler: (bindings: Bindings, store: StreamingStore<Quad>) => void;
}
