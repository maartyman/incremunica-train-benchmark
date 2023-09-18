import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { NamedNode } from 'n3';
import { BASE_PREFIX, CONNECTS_TO, LENGTH, MONITORED_BY, RDF, SEGMENT } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import { DEFAULT_SEGMENT_LENGTH } from '../../TrainBenchmarkConstants';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectConnectedSegments extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?sensor ?segment1 ?segment3
WHERE {
    ?segment1 base:connectsTo ?segment3 .
    ?segment1 base:monitoredBy ?sensor .
    ?segment3 base:monitoredBy ?sensor .

    ?sensor rdf:type base:Sensor .
    ?segment1 rdf:type base:Segment .
    ?segment3 rdf:type base:Segment .
}
`,
      'inject connected segments',
    );
  }

  protected _transform(bindings: Bindings): void {
    const id = this.driver.generateNewVertexId();

    const segment1 = this.getSafe(bindings, 'segment1');
    const segment2 = new NamedNode(`${BASE_PREFIX}_${id}`);
    const segment3 = this.getSafe(bindings, 'segment3');
    const sensor = this.getSafe(bindings, 'sensor');

    //console.log(segment1, segment2, segment3, sensor);

    this.driver.streamingStore.addQuad(new Quad(
      segment2,
      RDF.type,
      SEGMENT,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment2,
      LENGTH,
      DEFAULT_SEGMENT_LENGTH,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment1,
      CONNECTS_TO,
      segment2,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment2,
      CONNECTS_TO,
      segment3,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment2,
      MONITORED_BY,
      sensor,
    ));

    this.driver.streamingStore.removeQuad(new Quad(
      segment1,
      CONNECTS_TO,
      segment3,
    ));
  }
}
