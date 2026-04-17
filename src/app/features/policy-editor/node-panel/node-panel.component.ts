import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { NodeType } from '../../../core/models/graph.model';

interface NodeDef {
  type: NodeType;
  label: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-node-panel',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDividerModule],
  templateUrl: './node-panel.component.html',
  styleUrl: './node-panel.component.scss',
})
export class NodePanelComponent {
  @Output() addLane = new EventEmitter<void>();

  readonly nodes: NodeDef[] = [
    { type: 'start',    label: 'Inicio',    icon: 'play_circle',   color: '#43A047', description: 'Inicio del proceso' },
    { type: 'end',      label: 'Fin',       icon: 'stop_circle',   color: '#E53935', description: 'Fin del proceso' },
    { type: 'task',     label: 'Tarea',     icon: 'task_alt',      color: '#1E88E5', description: 'Actividad / tarea' },
    { type: 'decision', label: 'Decisión',  icon: 'call_split',    color: '#FB8C00', description: 'Bifurcación condicional' },
    { type: 'fork',     label: 'Fork',      icon: 'device_hub',    color: '#424242', description: 'Inicio paralelo' },
    { type: 'join',     label: 'Join',      icon: 'merge_type',    color: '#424242', description: 'Reunión de flujos' },
  ];

  onDragStart(event: DragEvent, type: NodeType): void {
    event.dataTransfer?.setData('nodeType', type);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy';
  }
}
