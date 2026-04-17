import {
  Component, ElementRef, EventEmitter, Input, OnChanges,
  OnDestroy, Output, ViewChild, AfterViewInit, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Graph, GraphNode, Lane, Edge, NodeType } from '../../../core/models/graph.model';
import { Mutation } from '../../../core/models/policy.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare const require: any;

const LANE_WIDTH  = 900;
const LANE_HEIGHT = 160;
const LANE_HEADER = 30;

const NODE_SIZES: Record<NodeType, { w: number; h: number }> = {
  start:    { w: 50,  h: 50  },
  end:      { w: 50,  h: 50  },
  task:     { w: 120, h: 45  },
  decision: { w: 80,  h: 80  },
  fork:     { w: 120, h: 12  },
  join:     { w: 120, h: 12  },
};

const NODE_STYLES: Record<NodeType, string> = {
  start:    'ellipse;fillColor=#43A047;strokeColor=#2E7D32;fontColor=#ffffff;fontSize=11;fontStyle=1;',
  end:      'doubleEllipse;fillColor=#E53935;strokeColor=#B71C1C;fontColor=#ffffff;fontSize=11;fontStyle=1;',
  task:     'rounded=1;arcSize=20;fillColor=#1E88E5;strokeColor=#1565C0;fontColor=#ffffff;fontSize=12;',
  decision: 'rhombus;fillColor=#FB8C00;strokeColor=#E65100;fontColor=#ffffff;fontSize=11;',
  fork:     'fillColor=#424242;strokeColor=#212121;fontColor=#ffffff;fontSize=9;',
  join:     'fillColor=#424242;strokeColor=#212121;fontColor=#ffffff;fontSize=9;',
};

const NODE_LABELS: Record<NodeType, string> = {
  start: 'Inicio', end: 'Fin', task: 'Tarea',
  decision: 'Decisión', fork: 'Fork', join: 'Join',
};

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('graphContainer') containerRef!: ElementRef<HTMLDivElement>;

  @Input() graph?: Graph;
  @Input() processingAi = false;

  @Output() graphChanged = new EventEmitter<Graph>();

  private mx: any;
  private g: any;          // mxGraph instance
  private laneMap  = new Map<string, any>();
  private nodeMap  = new Map<string, any>();
  private typeMap  = new Map<string, NodeType>();
  private keyHandler: any;

  ngAfterViewInit(): void {
    this.initMx();
    if (this.graph) this.loadGraph(this.graph);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graph'] && !changes['graph'].firstChange && this.g) {
      this.loadGraph(this.graph!);
    }
  }

  ngOnDestroy(): void {
    this.keyHandler?.destroy();
    this.g?.destroy();
  }

  // ─── Public API ───────────────────────────────────────────────

  loadGraph(graph: Graph): void {
    if (!this.g) return;
    const model = this.g.getModel();
    model.beginUpdate();
    try {
      this.g.removeCells(this.g.getChildCells(this.g.getDefaultParent(), true, true));
      this.laneMap.clear();
      this.nodeMap.clear();
      this.typeMap.clear();

      graph.lanes
        .slice()
        .sort((a, b) => a.order - b.order)
        .forEach((lane, idx) => {
          const laneCell = this.g.insertVertex(
            this.g.getDefaultParent(), lane.id, lane.label,
            0, idx * LANE_HEIGHT, LANE_WIDTH, LANE_HEIGHT,
            `swimlane;startSize=${LANE_HEADER};fillColor=#E3F2FD;strokeColor=#90CAF9;swimlaneLine=1;`
          );
          this.laneMap.set(lane.id, laneCell);
        });

      graph.nodes.forEach(node => {
        const laneCell = this.laneMap.get(node.laneId) ?? this.g.getDefaultParent();
        const size = NODE_SIZES[node.type];
        const cell = this.g.insertVertex(
          laneCell, node.id, node.label,
          node.x, node.y, size.w, size.h, NODE_STYLES[node.type]
        );
        this.nodeMap.set(node.id, cell);
        this.typeMap.set(node.id, node.type);
      });

      graph.edges.forEach(edge => {
        const src = this.nodeMap.get(edge.from);
        const tgt = this.nodeMap.get(edge.to);
        if (src && tgt) {
          this.g.insertEdge(this.g.getDefaultParent(), edge.id, edge.label ?? '', src, tgt);
        }
      });
    } finally {
      model.endUpdate();
    }
    this.g.fit();
  }

  getGraph(): Graph {
    const model = this.g.getModel();
    const lanes: Lane[]      = [];
    const nodes: GraphNode[] = [];
    const edges: Edge[]      = [];
    const parent = this.g.getDefaultParent();
    const count  = model.getChildCount(parent);

    for (let i = 0; i < count; i++) {
      const cell = model.getChildAt(parent, i);
      if (this.g.isSwimlane(cell)) {
        lanes.push({ id: cell.getId(), label: model.getValue(cell), order: i });
        const nc = model.getChildCount(cell);
        for (let j = 0; j < nc; j++) {
          const nc2 = model.getChildAt(cell, j);
          if (!model.isEdge(nc2)) {
            const geo = model.getGeometry(nc2);
            nodes.push({
              id: nc2.getId(),
              type: this.typeMap.get(nc2.getId()) ?? 'task',
              label: model.getValue(nc2) ?? '',
              laneId: cell.getId(),
              x: geo?.x ?? 0,
              y: geo?.y ?? 0,
            });
          }
        }
      } else if (model.isEdge(cell)) {
        const src = model.getTerminal(cell, true);
        const tgt = model.getTerminal(cell, false);
        if (src && tgt) {
          edges.push({
            id: cell.getId(),
            from: src.getId(),
            to: tgt.getId(),
            label: model.getValue(cell) || undefined,
          });
        }
      }
    }
    return { lanes, nodes, edges };
  }

  applyMutations(mutations: Mutation[]): void {
    const model = this.g.getModel();
    model.beginUpdate();
    try {
      for (const mut of mutations) {
        const p = mut.payload as any;
        switch (mut.type) {
          case 'ADD_NODE': {
            const lane = this.laneMap.get(p['laneId']) ?? this.g.getDefaultParent();
            const type: NodeType = p['type'] ?? 'task';
            const size = NODE_SIZES[type];
            const cell = this.g.insertVertex(
              lane, p['id'], p['label'] ?? NODE_LABELS[type],
              p['x'] ?? 60, p['y'] ?? 60, size.w, size.h, NODE_STYLES[type]
            );
            this.nodeMap.set(p['id'], cell);
            this.typeMap.set(p['id'], type);
            break;
          }
          case 'ADD_EDGE': {
            const src = this.nodeMap.get(p['from']);
            const tgt = this.nodeMap.get(p['to']);
            if (src && tgt) {
              this.g.insertEdge(this.g.getDefaultParent(), p['id'], p['label'] ?? '', src, tgt);
            }
            break;
          }
          case 'DELETE_NODE': {
            const cell = this.nodeMap.get(p['id']);
            if (cell) { this.g.removeCells([cell]); this.nodeMap.delete(p['id']); this.typeMap.delete(p['id']); }
            break;
          }
          case 'DELETE_EDGE': {
            const parent2 = this.g.getDefaultParent();
            const cnt = model.getChildCount(parent2);
            for (let i = 0; i < cnt; i++) {
              const c = model.getChildAt(parent2, i);
              if (model.isEdge(c) && c.getId() === p['id']) {
                this.g.removeCells([c]); break;
              }
            }
            break;
          }
          case 'UPDATE_NODE': {
            const cell = this.nodeMap.get(p['id']);
            if (cell) model.setValue(cell, p['label']);
            break;
          }
        }
      }
    } finally {
      model.endUpdate();
    }
    this.graphChanged.emit(this.getGraph());
  }

  addLane(label = 'Nuevo carril'): void {
    const model = this.g.getModel();
    model.beginUpdate();
    try {
      const order = this.laneMap.size;
      const id = `lane_${Date.now()}`;
      const cell = this.g.insertVertex(
        this.g.getDefaultParent(), id, label,
        0, order * LANE_HEIGHT, LANE_WIDTH, LANE_HEIGHT,
        `swimlane;startSize=${LANE_HEADER};fillColor=#E3F2FD;strokeColor=#90CAF9;`
      );
      this.laneMap.set(id, cell);
    } finally {
      model.endUpdate();
    }
    this.graphChanged.emit(this.getGraph());
  }

  // ─── Private ─────────────────────────────────────────────────

  private initMx(): void {
    this.mx = (require as any)('mxgraph')({
      mxBasePath: '',
      mxLoadResources: false,
      mxLoadStylesheets: false,
    });
    const { mxGraph, mxEvent, mxKeyHandler, mxConstants, mxEdgeStyle } = this.mx;

    const container = this.containerRef.nativeElement;
    mxEvent.disableContextMenu(container);

    this.g = new mxGraph(container);
    this.g.setConnectable(true);
    this.g.setTooltips(false);
    this.g.setEnabled(true);
    this.g.swimlaneNesting = false;
    this.g.setAllowDanglingEdges(false);
    this.g.setDisconnectOnMove(false);

    // Style defaults
    const style = this.g.getStylesheet().getDefaultEdgeStyle();
    style[mxConstants.STYLE_ROUNDED]    = 1;
    style[mxConstants.STYLE_EDGE]       = mxEdgeStyle.ElbowConnector;
    style[mxConstants.STYLE_STROKECOLOR] = '#546E7A';
    style[mxConstants.STYLE_FONTCOLOR]   = '#37474F';

    // Keyboard delete
    this.keyHandler = new mxKeyHandler(this.g);
    this.keyHandler.bindKey(46, () => {
      const cells = this.g.getSelectionCells();
      if (cells.length) {
        this.g.removeCells(cells);
        this.graphChanged.emit(this.getGraph());
      }
    });

    // Emit on graph changes
    this.g.getModel().addListener(mxEvent.CHANGE, () => {
      this.graphChanged.emit(this.getGraph());
    });

    // Drop handler (drag from node-panel)
    container.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    });
    container.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer?.getData('nodeType') as NodeType | undefined;
      if (!nodeType) return;

      const rect   = container.getBoundingClientRect();
      const scale  = this.g.view.scale;
      const tx     = this.g.view.translate.x;
      const ty     = this.g.view.translate.y;
      const gx     = (e.clientX - rect.left) / scale - tx;
      const gy     = (e.clientY - rect.top)  / scale - ty;

      // Find target lane
      let targetLane = this.g.getDefaultParent();
      for (const [, lane] of this.laneMap) {
        const geo = this.g.getCellGeometry(lane);
        if (geo && gy >= geo.y && gy <= geo.y + geo.height) {
          targetLane = lane;
          break;
        }
      }

      // Coordinate relative to lane
      const laneGeo = this.g.getCellGeometry(targetLane);
      const lx = laneGeo ? gx - laneGeo.x : gx;
      const ly = laneGeo ? gy - laneGeo.y - LANE_HEADER : gy;

      const id   = `node_${Date.now()}`;
      const size = NODE_SIZES[nodeType];
      const model = this.g.getModel();
      model.beginUpdate();
      try {
        const cell = this.g.insertVertex(
          targetLane, id, NODE_LABELS[nodeType],
          Math.max(0, lx - size.w / 2), Math.max(0, ly - size.h / 2),
          size.w, size.h, NODE_STYLES[nodeType]
        );
        this.nodeMap.set(id, cell);
        this.typeMap.set(id, nodeType);
      } finally {
        model.endUpdate();
      }
      this.graphChanged.emit(this.getGraph());
    });
  }
}
