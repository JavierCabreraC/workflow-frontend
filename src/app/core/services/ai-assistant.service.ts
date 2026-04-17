import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Graph } from '../models/graph.model';
import { Mutation } from '../models/policy.model';

export interface DiagramPromptResponse {
  mutations: Mutation[];
  explanation: string;
}

export interface BottleneckResponse {
  report: string;
  bottlenecks: unknown[];
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ai`;
  private sessionId = crypto.randomUUID();

  sendDiagramPrompt(prompt: string, graph: Graph): Observable<DiagramPromptResponse> {
    return this.http.post<DiagramPromptResponse>(`${this.base}/diagram`, { prompt, graph });
  }

  askTutor(prompt: string): Observable<string> {
    return this.http.post(`${this.base}/tutor`, { prompt, sessionId: this.sessionId }, { responseType: 'text' });
  }

  getBottleneckReport(policyId: string): Observable<BottleneckResponse> {
    return this.http.get<BottleneckResponse>(`${environment.apiUrl}/analytics/policy/${policyId}/bottlenecks`);
  }
}
