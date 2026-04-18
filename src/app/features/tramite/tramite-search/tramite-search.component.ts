import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TramiteService } from '../../../core/services/tramite.service';
import { PolicyService } from '../../../core/services/policy.service';
import { Tramite } from '../../../core/models/tramite.model';
import { Policy } from '../../../core/models/policy.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { NewTramiteDialogComponent } from './new-tramite-dialog.component';

@Component({
  selector: 'app-tramite-search',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatInputModule, MatFormFieldModule, MatButtonModule, MatIconModule,
    MatCardModule, MatDialogModule, MatSelectModule, MatProgressSpinnerModule,
    StatusBadgeComponent, TimeAgoPipe
  ],
  templateUrl: './tramite-search.component.html',
  styleUrl: './tramite-search.component.scss'
})
export class TramiteSearchComponent implements OnInit {
  private tramiteService = inject(TramiteService);
  private policyService = inject(PolicyService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  searchControl = this.fb.control('');
  tramites: Tramite[] = [];
  activePolicies: Policy[] = [];
  loading = false;

  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.policyService.getPolicies().subscribe(policies => {
      this.activePolicies = policies.filter(p => p.status === 'ACTIVE');
    });

    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        this.loading = true;
        return this.tramiteService.searchTramites(query ?? '');
      })
    ).subscribe({
      next: results => { this.tramites = results; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openNewTramite(): void {
    const ref = this.dialog.open(NewTramiteDialogComponent, {
      width: '420px',
      data: { policies: this.activePolicies }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.tramiteService.createTramite(result.policyId, result.clientName, result.clientContact).subscribe({
          next: tramite => this.router.navigate(['/tramites', tramite.id])
        });
      }
    });
  }

  goToTimeline(id: string): void {
    this.router.navigate(['/tramites', id]);
  }
}
