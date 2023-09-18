import type { Bindings } from '@incremunica/incremental-types';
import { Quad } from '@incremunica/incremental-types';
import { DataFactory } from 'n3';
import { LENGTH } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class RepairPosLength extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?segment ?length
WHERE
{
    ?segment rdf:type base:Segment .
    ?segment base:length ?length .

    FILTER (?length <= 0)
}
`,
      'repair pos length',
    );
  }

  protected _transform(bindings: Bindings): void {
    const segment = this.getSafe(bindings, 'segment');
    const newLength = Number.parseInt(this.getSafe(bindings, 'length').value, 10) + 1;

    this.driver.deleteQuads(
      segment,
      LENGTH,
      null,
      null,
    );

    this.driver.streamingStore.addQuad(new Quad(
      segment,
      LENGTH,
      DataFactory.literal(newLength),
      undefined,
    ));
  }
}
