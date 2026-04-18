import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { PolicyService } from '../../../core/services/policy.service';
import { AiAssistantService, BottleneckResponse } from '../../../core/services/ai-assistant.service';
import { Policy } from '../../../core/models/policy.model';

interface FuncionarioRow {
  name: string;
  completed: number;
  avgMinutes: number;
  efficiency: string;
}

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatSelectModule, MatFormFieldModule, MatButtonModule,
    MatIconModule, MatTableModule, MatSortModule, MatProgressSpinnerModule
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit {
  private policyService = inject(PolicyService);
  private aiService = inject(AiAssistantService);

  activePolicies: Policy[] = [];
  selectedPolicyId = '';
  selectedPolicy: Policy | null = null;

  loadingReport = false;
  report: BottleneckResponse | null = null;

  displayedColumns = ['name', 'completed', 'avgMinutes', 'efficiency'];
  funcionarios: FuncionarioRow[] = [];

  summaryCards = [
    { label: 'Trámites activos', value: '—', icon: 'pending_actions' },
    { label: 'Completados', value: '—', icon: 'check_circle' },
    { label: 'Tiempo promedio', value: '—', icon: 'schedule' },
    { label: 'Nodo más lento', value: '—', icon: 'warning', highlight: true }
  ];

  ngOnInit(): void {
    this.policyService.getPolicies().subscribe(policies => {
      this.activePolicies = policies.filter(p => p.status === 'ACTIVE');
    });
  }

  onPolicyChange(): void {
    this.selectedPolicy = this.activePolicies.find(p => p.id === this.selectedPolicyId) ?? null;
    this.report = null;
    this.loadReport();
  }

  loadReport(): void {
    if (!this.selectedPolicyId) return;
    this.loadingReport = true;
    this.aiService.getBottleneckReport(this.selectedPolicyId).subscribe({
      next: result => {
        this.report = result;
        this.loadingReport = false;
        this.updateSummaryFromBottlenecks(result);
      },
      error: () => { this.loadingReport = false; }
    });
  }

  private updateSummaryFromBottlenecks(result: BottleneckResponse): void {
    const bottlenecks = result.bottlenecks as Array<{ nodeName?: string; avgMinutes?: number }>;
    if (bottlenecks.length > 0) {
      const slowest = bottlenecks.reduce((prev, cur) =>
        (cur.avgMinutes ?? 0) > (prev.avgMinutes ?? 0) ? cur : prev, bottlenecks[0]);
      this.summaryCards[3].value = slowest.nodeName ?? '—';
    }
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') return;
    this.funcionarios = [...this.funcionarios].sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      const key = sort.active as keyof FuncionarioRow;
      return compare(a[key], b[key], isAsc);
    });
  }
}

function compare(a: string | number, b: string | number, isAsc: boolean): number {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
