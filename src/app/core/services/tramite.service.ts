import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tramite, TramiteEvent } from '../models/tramite.model';

@Injectable({ providedIn: 'root' })
export class TramiteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tramites`;

  createTramite(policyId: string, clientName: string, clientContact: string): Observable<Tramite> {
    return this.http.post<Tramite>(this.base, { policyId, clientName, clientContact });
  }

  searchTramites(query: string): Observable<Tramite[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Tramite[]>(this.base, { params });
  }

  getTramiteById(id: string): Observable<Tramite> {
    return this.http.get<Tramite>(`${this.base}/${id}`);
  }

  getTimeline(id: string): Observable<TramiteEvent[]> {
    return this.http.get<TramiteEvent[]>(`${this.base}/${id}/timeline`);
  }

  registerFcmToken(tramiteId: string, token: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${tramiteId}/fcm`, { token });
  }
}
