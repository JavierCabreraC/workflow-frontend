import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Policy, PolicyStatus } from '../models/policy.model';
import { Graph } from '../models/graph.model';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/policies`;

  getPolicies(): Observable<Policy[]> {
    return this.http.get<Policy[]>(this.base);
  }

  getPolicyById(id: string): Observable<Policy> {
    return this.http.get<Policy>(`${this.base}/${id}`);
  }

  createPolicy(name: string, description: string): Observable<Policy> {
    return this.http.post<Policy>(this.base, { name, description });
  }

  updateGraph(id: string, graph: Graph): Observable<Policy> {
    return this.http.put<Policy>(`${this.base}/${id}/graph`, graph);
  }

  updateStatus(id: string, status: PolicyStatus): Observable<Policy> {
    return this.http.put<Policy>(`${this.base}/${id}/status`, { status });
  }

  deletePolicy(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
