export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export interface Task {
  id: string;
  tramiteId: string;
  nodeId: string;
  nodeName: string;
  assignedToRole: string;
  status: TaskStatus;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
}
