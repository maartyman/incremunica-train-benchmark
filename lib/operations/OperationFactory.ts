import type { Driver } from '../Driver';
import type { BenchmarkConfig } from '../Types';
import { BatchConnectedSegments } from './batch/BatchConnectedSegments';
import { BatchOperation } from './batch/BatchOperation';
import { BatchPosLength } from './batch/BatchPosLength';
import { BatchRouteSensor } from './batch/BatchRouteSensor';
import { BatchSemaphoreNeighbor } from './batch/BatchSemaphoreNeighbor';
import { BatchSwitchMonitored } from './batch/BatchSwitchMonitored';
import { BatchSwitchSet } from './batch/BatchSwitchSet';
import { InjectConnectedSegments } from './inject/InjectConnectedSegments';
import { InjectPosLength } from './inject/InjectPosLength';
import { InjectRouteSensor } from './inject/InjectRouteSensor';
import { InjectSegmentForSensor } from './inject/InjectSegmentForSensor';
import { InjectSemaphoreNeighbor } from './inject/InjectSemaphoreNeighbor';
import { InjectSwitchMonitored } from './inject/InjectSwitchMonitored';
import { InjectSwitchSet } from './inject/InjectSwitchSet';
import type { Operation } from './Operation';
import { RepairConnectedSegments } from './repair/RepairConnectedSegments';
import { RepairPosLength } from './repair/RepairPosLength';
import { RepairRouteSensor } from './repair/RepairRouteSensor';
import { RepairSegmentForSensor } from './repair/RepairSegmentForSensor';
import { RepairSemaphoreNeighbor } from './repair/RepairSemaphoreNeighbor';
import { RepairSwitchMonitored } from './repair/RepairSwitchMonitored';
import { RepairSwitchSet } from './repair/RepairSwitchSet';

export const OperationFactory = {
  create(operationString: string, driver: Driver, config: BenchmarkConfig): Operation {
    const match = operationString.match(/\d+/ug);
    let size = 0;
    if (match) {
      size = Number.parseInt(match[0], 10);
    }
    operationString = operationString.replace(/\d+/ug, '');
    switch (operationString) {
      // Batch
      case 'BatchConnectedSegments': {
        return new BatchConnectedSegments(driver, config);
      }
      case 'BatchPosLength': {
        return new BatchPosLength(driver, config);
      }
      case 'BatchRouteSensor': {
        return new BatchRouteSensor(driver, config);
      }
      case 'BatchSemaphoreNeighbor': {
        return new BatchSemaphoreNeighbor(driver, config);
      }
      case 'BatchSwitchMonitored': {
        return new BatchSwitchMonitored(driver, config);
      }
      case 'BatchSwitchSet': {
        return new BatchSwitchSet(driver, config);
      }
      case 'BatchChain': {
        let queryString = 'PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>\n';
        queryString += 'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\n';
        queryString += 'SELECT ';

        for (let i = 1; i <= size + 1; i++) {
          queryString += `?segment${i} `;
        }

        queryString += 'WHERE\n{\n';

        for (let i = 1; i <= size; i++) {
          queryString += `?segment${i} base:connectsTo ?segment${i + 1} .\n`;
        }

        queryString += `}`;

        return new BatchOperation(
          driver,
          config,
          queryString,
          `batch chain ${size}`,
        );
      }
      case 'BatchStar': {
        let queryString = 'PREFIX base: <http://www.semanticweb.org/ontologies/2015/trainbenchmark#>\n';
        queryString += 'PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n\n';
        queryString += 'SELECT ?sensor ';

        for (let i = 1; i <= size; i++) {
          queryString += `?trackElement${i} `;
        }

        queryString += 'WHERE\n{\n';

        for (let i = 1; i <= size; i++) {
          queryString += `?trackElement${i} base:monitoredBy ?sensor .\n`;
        }

        queryString += `}`;

        return new BatchOperation(
          driver,
          config,
          queryString,
          `batch star ${size}`,
        );
      }
      // Inject
      case 'InjectConnectedSegments': {
        return new InjectConnectedSegments(driver, config);
      }
      case 'InjectPosLength': {
        return new InjectPosLength(driver, config);
      }
      case 'InjectRouteSensor': {
        return new InjectRouteSensor(driver, config);
      }
      case 'InjectSemaphoreNeighbor': {
        return new InjectSemaphoreNeighbor(driver, config);
      }
      case 'InjectSwitchMonitored': {
        return new InjectSwitchMonitored(driver, config);
      }
      case 'InjectSwitchSet': {
        return new InjectSwitchSet(driver, config);
      }
      case 'InjectChain': {
        return new InjectConnectedSegments(driver, config);
      }
      case 'InjectStar': {
        return new InjectSegmentForSensor(driver, config);
      }
      // Repair
      case 'RepairConnectedSegments': {
        return new RepairConnectedSegments(driver, config);
      }
      case 'RepairPosLength': {
        return new RepairPosLength(driver, config);
      }
      case 'RepairRouteSensor': {
        return new RepairRouteSensor(driver, config);
      }
      case 'RepairSemaphoreNeighbor': {
        return new RepairSemaphoreNeighbor(driver, config);
      }
      case 'RepairSwitchMonitored': {
        return new RepairSwitchMonitored(driver, config);
      }
      case 'RepairSwitchSet': {
        return new RepairSwitchSet(driver, config);
      }
      case 'RepairChain': {
        return new RepairConnectedSegments(driver, config);
      }
      case 'RepairStar': {
        return new RepairSegmentForSensor(driver, config);
      }
    }
    throw new Error(`No cases matched ${operationString}`);
  },
};
