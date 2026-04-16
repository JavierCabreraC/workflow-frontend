import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';
import { User, LoginResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private jwtHelper = new JwtHelperService();

  private readonly TOKEN_KEY = 'token';
  currentUser$ = new BehaviorSubject<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.TOKEN_KEY, response.token);
        const decoded = this.jwtHelper.decodeToken(response.token);
        const user: User = {
          id: decoded.sub ?? decoded.id ?? '',
          email: response.email,
          name: response.name,
          role: response.role as User['role'],
          active: true
        };
        this.currentUser$.next(user);
      })
    );
  }

  register(name: string, email: string, password: string, role: string): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/auth/register`, { name, email, password, role });
  }

  me(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.currentUser$.next(user))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  hasRole(role: string): boolean {
    return this.currentUser$.value?.role === role;
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (token && !this.jwtHelper.isTokenExpired(token)) {
      const decoded = this.jwtHelper.decodeToken(token);
      const user: User = {
        id: decoded.sub ?? decoded.id ?? '',
        email: decoded.email ?? '',
        name: decoded.name ?? '',
        role: decoded.role as User['role'],
        active: true
      };
      this.currentUser$.next(user);
    }
  }
}
