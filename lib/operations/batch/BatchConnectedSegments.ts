import type { Driver } from '../../Driver';
import type { BenchmarkConfig } from '../../Types';
import { BatchOperation } from './BatchOperation';

export class BatchConnectedSegments extends BatchOperation {
  public constructor(driver: Driver, config: BenchmarkConfig) {
    super(
      driver,
      config,
      `
PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>
PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?sensor ?segment1 ?segment2 ?segment3 ?segment4 ?segment5 ?segment6
WHERE
{   
    ?segment1 base:connectsTo ?segment2 .
    ?segment2 base:connectsTo ?segment3 .
    ?segment3 base:connectsTo ?segment4 .
    ?segment4 base:connectsTo ?segment5 .
    ?segment5 base:connectsTo ?segment6 .
    
    ?sensor rdf:type base:Sensor .
    ?segment1 base:monitoredBy ?sensor .
    ?segment2 base:monitoredBy ?sensor .
    ?segment3 base:monitoredBy ?sensor .
    ?segment4 base:monitoredBy ?sensor .
    ?segment5 base:monitoredBy ?sensor .
    ?segment6 base:monitoredBy ?sensor .
    
    ?segment1 rdf:type base:Segment .
    ?segment2 rdf:type base:Segment .
    ?segment3 rdf:type base:Segment .
    ?segment4 rdf:type base:Segment .
    ?segment5 rdf:type base:Segment .
    ?segment6 rdf:type base:Segment .
}
`,
      'batch connected segments',
    );
  }
}
