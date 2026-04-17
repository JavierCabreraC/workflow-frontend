import {
  Component, inject, OnInit, OnDestroy, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { PolicyService } from '../../../core/services/policy.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Policy, Mutation, PolicyStatus } from '../../../core/models/policy.model';
import { Graph } from '../../../core/models/graph.model';
import { CanvasComponent } from '../canvas/canvas.component';
import { NodePanelComponent } from '../node-panel/node-panel.component';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';
import { ConfirmDialogComponent } from '../policy-list/confirm-dialog.component';

@Component({
  selector: 'app-editor-shell',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule,
    CanvasComponent, NodePanelComponent, AiAssistantComponent,
  ],
  templateUrl: './editor-shell.component.html',
  styleUrl: './editor-shell.component.scss',
})
export class EditorShellComponent implements OnInit, OnDestroy {
  @ViewChild(CanvasComponent) canvas!: CanvasComponent;

  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private ps      = inject(PolicyService);
  private ws      = inject(WebsocketService);
  private notify  = inject(NotificationService);
  private dialog  = inject(MatDialog);

  policy?: Policy;
  currentGraph?: Graph;
  loading   = true;
  saving    = false;
  aiProcessing = false;
  connectedUsers = 1;

  private policyId = '';

  ngOnInit(): void {
    this.policyId = this.route.snapshot.paramMap.get('id') ?? '';
    this.ps.getPolicyById(this.policyId).subscribe({
      next: (p) => {
        this.policy      = p;
        this.currentGraph = p.graph;
        this.loading     = false;
        this.connectWs();
      },
      error: () => {
        this.notify.error('No se pudo cargar la política');
        this.router.navigate(['/editor']);
      },
    });
  }

  ngOnDestroy(): void {
    this.ws.disconnect();
  }

  onGraphChanged(graph: Graph): void {
    this.currentGraph = graph;
  }

  onMutationsReady(mutations: Mutation[]): void {
    this.canvas.applyMutations(mutations);
    // Broadcast to collaborators
    this.ws.publish(
      `/app/policy/${this.policyId}/mutation`,
      JSON.stringify(mutations)
    );
  }

  onAiProcessing(active: boolean): void {
    this.aiProcessing = active;
  }

  onAddLane(): void {
    this.canvas.addLane();
  }

  save(): void {
    if (!this.currentGraph || !this.policy) return;
    this.saving = true;
    this.ps.updateGraph(this.policyId, this.currentGraph).subscribe({
      next: (updated) => {
        this.policy = updated;
        this.saving = false;
        this.notify.success('Diagrama guardado');
      },
      error: () => { this.saving = false; this.notify.error('Error al guardar'); },
    });
  }

  toggleStatus(): void {
    if (!this.policy) return;
    const newStatus: PolicyStatus = this.policy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const label = newStatus === 'ACTIVE' ? 'activar' : 'desactivar';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { title: `${newStatus === 'ACTIVE' ? 'Activar' : 'Desactivar'} política`, message: `¿Deseas ${label} esta política?` },
    });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.ps.updateStatus(this.policyId, newStatus).subscribe({
        next: (p) => { this.policy = p; this.notify.success('Estado actualizado'); },
        error: () => this.notify.error('Error al actualizar estado'),
      });
    });
  }

  backToList(): void {
    this.router.navigate(['/editor']);
  }

  private connectWs(): void {
    this.ws.connect();
    this.ws.subscribe(`/topic/policy/${this.policyId}`, (msg) => {
      try {
        const mutations: Mutation[] = JSON.parse(msg.body);
        if (this.canvas) this.canvas.applyMutations(mutations);
      } catch { /* ignore malformed messages */ }
    });
  }
}
