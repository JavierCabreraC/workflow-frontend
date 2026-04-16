export type TramiteStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'REJECTED';

export interface TramiteEvent {
  nodeId: string;
  nodeName: string;
  completedBy: string;
  notes: string;
  startedAt: string;
  completedAt: string;
  durationMinutes: number;
}

export interface Tramite {
  id: string;
  policyId: string;
  currentNodeId: string;
  status: TramiteStatus;
  clientName: string;
  clientContact: string;
  history: TramiteEvent[];
  createdAt: string;
}
