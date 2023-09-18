import type { Bindings } from '@incremunica/incremental-types';
import { MONITORED_BY } from '../../BenchmarkTerms';
import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { TransformationOperation } from '../TransformationOperation';

export class InjectSwitchMonitored extends TransformationOperation {
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
      'inject switch monitored',
    );
  }

  protected _transform(bindings: Bindings): void {
    this.driver.deleteQuads(
      this.getSafe(bindings, 'sw'),
      MONITORED_BY,
      null,
      null,
    );
  }
}
