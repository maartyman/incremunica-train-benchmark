import { NamedNode } from 'n3';

export const BASE_PREFIX = 'http://www.semanticweb.org/ontologies/2015/trainbenchmark#';

export const REGION = new NamedNode(`${BASE_PREFIX}Region`);
export const ROUTE = new NamedNode(`${BASE_PREFIX}Route`);
export const SEGMENT = new NamedNode(`${BASE_PREFIX}Segment`);
export const SENSOR = new NamedNode(`${BASE_PREFIX}Sensor`);
export const SEMAPHORE = new NamedNode(`${BASE_PREFIX}Semaphore`);
export const SWITCH = new NamedNode(`${BASE_PREFIX}Switch`);
export const SWITCHPOSITION = new NamedNode(`${BASE_PREFIX}SwitchPosition`);
export const TRACKELEMENT = new NamedNode(`${BASE_PREFIX}TrackElement`);

// Attributes
export const ACTIVE = new NamedNode(`${BASE_PREFIX}active`);
export const LENGTH = new NamedNode(`${BASE_PREFIX}length`);
export const SIGNAL = new NamedNode(`${BASE_PREFIX}signal`);
export const CURRENTPOSITION = new NamedNode(`${BASE_PREFIX}currentPosition`);
export const POSITION = new NamedNode(`${BASE_PREFIX}position`);

// References
export const CONNECTS_TO = new NamedNode(`${BASE_PREFIX}connectsTo`);
export const ELEMENTS = new NamedNode(`${BASE_PREFIX}elements`);
export const EXIT = new NamedNode(`${BASE_PREFIX}exit`);
export const ENTRY = new NamedNode(`${BASE_PREFIX}entry`);
export const FOLLOWS = new NamedNode(`${BASE_PREFIX}follows`);
export const REQUIRES = new NamedNode(`${BASE_PREFIX}requires`);
export const MONITORED_BY = new NamedNode(`${BASE_PREFIX}monitoredBy`);
export const SEMAPHORES = new NamedNode(`${BASE_PREFIX}semaphores`);
export const SENSORS = new NamedNode(`${BASE_PREFIX}sensors`);
export const TARGET = new NamedNode(`${BASE_PREFIX}target`);

export const RDF = {
  type: new NamedNode(`http://www.w3.org/1999/02/22-rdf-syntax-ns#type`),
};
