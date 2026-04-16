import { Graph } from './graph.model';

export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type MutationType = 'ADD_NODE' | 'ADD_EDGE' | 'DELETE_NODE' | 'DELETE_EDGE' | 'UPDATE_NODE';

export interface Policy {
  id: string;
  name: string;
  description: string;
  status: PolicyStatus;
  graph: Graph;
  createdBy: string;
  createdAt: string;
}

export interface Mutation {
  type: MutationType;
  payload: Record<string, unknown>;
}
