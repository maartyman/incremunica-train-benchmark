import type { Bindings } from '@incremunica/incremental-types';

import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class RepairSegmentForSensor extends TransformationOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?segment ?sensor
WHERE
{
    ?segment a :Segment .
    ?segment :monitoredBy ?sensor .
}
`,
      'repair star',
    );
  }

  protected _transform(bindings: Bindings): void {
    const segment = this.getSafe(bindings, 'segment');
    const sensor = this.getSafe(bindings, 'sensor');

    this.driver.deleteQuads(
      segment,
      null,
      null,
      null,
    );
  }
}
