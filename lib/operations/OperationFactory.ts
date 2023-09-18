import type { Driver } from '../Driver';
import type { BenchmarkConfig } from '../Types';
import { BatchConnectedSegments } from './batch/BatchConnectedSegments';
import { BatchPosLength } from './batch/BatchPosLength';
import { BatchRouteSensor } from './batch/BatchRouteSensor';
import { BatchSemaphoreNeighbor } from './batch/BatchSemaphoreNeighbor';
import { BatchSwitchMonitored } from './batch/BatchSwitchMonitored';
import { BatchSwitchSet } from './batch/BatchSwitchSet';
import { InjectConnectedSegments } from './inject/InjectConnectedSegments';
import { InjectPosLength } from './inject/InjectPosLength';
import { InjectRouteSensor } from './inject/InjectRouteSensor';
import { InjectSemaphoreNeighbor } from './inject/InjectSemaphoreNeighbor';
import { InjectSwitchMonitored } from './inject/InjectSwitchMonitored';
import { InjectSwitchSet } from './inject/InjectSwitchSet';
import type { Operation } from './Operation';
import { RepairConnectedSegments } from './repair/RepairConnectedSegments';
import { RepairPosLength } from './repair/RepairPosLength';
import { RepairRouteSensor } from './repair/RepairRouteSensor';
import { RepairSemaphoreNeighbor } from './repair/RepairSemaphoreNeighbor';
import { RepairSwitchMonitored } from './repair/RepairSwitchMonitored';
import { RepairSwitchSet } from './repair/RepairSwitchSet';

export const OperationFactory = {
  create(operationString: string, driver: Driver, config: BenchmarkConfig): Operation {
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
    }
    throw new Error(`No cases matched ${operationString}`);
  },
};
