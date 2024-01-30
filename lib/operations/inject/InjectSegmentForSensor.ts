import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { DataFactory, NamedNode } from 'n3';
import {
  BASE_PREFIX,
  LENGTH,
  MONITORED_BY,
  RDF,
  SEGMENT,
  TRACKELEMENT,
} from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectSegmentForSensor extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?sensor
WHERE
{
  ?sensor a base:Sensor .
}
`,
      'inject star',
    );
  }

  protected _transform(bindings: Bindings): void {
    const id = this.driver.generateNewVertexId();
    const segment = new NamedNode(`${BASE_PREFIX}_${id}`);
    const sensor = this.getSafe(bindings, 'sensor');

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      RDF.type,
      TRACKELEMENT,
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      RDF.type,
      SEGMENT,
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      LENGTH,
      DataFactory.literal(0),
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      LENGTH,
      DataFactory.literal(0),
      undefined,
    ));

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      MONITORED_BY,
      sensor,
      undefined,
    ));
  }
}
