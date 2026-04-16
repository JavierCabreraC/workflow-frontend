export type NodeType = 'start' | 'end' | 'task' | 'decision' | 'fork' | 'join';

export interface Lane {
  id: string;
  label: string;
  order: number;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  laneId: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface Graph {
  lanes: Lane[];
  nodes: GraphNode[];
  edges: Edge[];
}
