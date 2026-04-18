import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TramiteService } from '../../../core/services/tramite.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { Tramite, TramiteEvent } from '../../../core/models/tramite.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-tramite-timeline',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    StatusBadgeComponent, TimeAgoPipe
  ],
  templateUrl: './tramite-timeline.component.html',
  styleUrl: './tramite-timeline.component.scss'
})
export class TramiteTimelineComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tramiteService = inject(TramiteService);
  private wsService = inject(WebsocketService);

  tramite: Tramite | null = null;
  timeline: TramiteEvent[] = [];
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.tramiteService.getTramiteById(id).subscribe(t => { this.tramite = t; });
    this.tramiteService.getTimeline(id).subscribe({
      next: events => { this.timeline = events; this.loading = false; },
      error: () => { this.loading = false; }
    });

    this.wsService.connect();
    this.wsService.subscribe(`/topic/tramite/${id}`, msg => {
      const updated: Tramite = JSON.parse(msg.body);
      this.tramite = updated;
    });
  }

  ngOnDestroy(): void {
    this.wsService.disconnect();
  }

  isCurrentNode(event: TramiteEvent): boolean {
    return this.tramite?.currentNodeId === event.nodeId && !event.completedAt;
  }
}
