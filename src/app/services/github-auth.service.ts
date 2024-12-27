import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, firstValueFrom, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { CallbackResponse, GithubAuthUrl } from '../models/auth.model';
import { Router } from '@angular/router';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root',
})
export class GithubAuthService {
  private isConnected = new BehaviorSubject<boolean>(false);
  private token = new BehaviorSubject<string | null>(null);
  private integrationData = new BehaviorSubject<CallbackResponse | null>(null);

  private readonly API_URL = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
    private loadingService: LoadingService
  ) {
    this.initializeToken();
    this.checkIntegrationStatus();
  }


  private initializeToken (): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.token.next(token);
      this.isConnected.next(true);
    }
  }


  private checkIntegrationStatus (): void {
    this.loadingService.showOn();

    const token = localStorage.getItem('token');
    if (token) {
      this.setToken(token);
      this.verifyToken().subscribe({
        next: (res) => {
          const { isAuthenticated } = res;
          this.isConnected.next(isAuthenticated);
          this.integrationData.next(res)
        },
        error: (error) => {
          console.error('Error verifying token:', error);
          this.clearToken();
          this.isConnected.next(false);
          this.integrationData.next(null)
        },
        complete: () => {
          this.loadingService.showOff();
        },
      });
    } else {
      this.clearToken();
      this.isConnected.next(false);
      this.loadingService.showOff();
    }
  }


  getIsConnected (): Observable<boolean> {
    return this.isConnected.asObservable();
  }

  getIntegrationData (): Observable<CallbackResponse | null> {
    return this.integrationData.asObservable();
  }


  async redirectToGithubAuth (): Promise<void> {
    try {
      const { url } = await firstValueFrom(
        this.http.get<GithubAuthUrl>(`${this.API_URL}/auth/github/url`)
      );
      window.location.href = url;
    } catch (error) {
      this.handleError('Error during redirect to GitHub auth:', error);
    }
  }


  async handleCallback (code: string, state: string): Promise<CallbackResponse> {
    this.loadingService.showOn();
    try {
      const response = await firstValueFrom(
        this.http.get<CallbackResponse>(`${this.API_URL}/auth/github/callback`, {
          params: { code, state },
        })
      );

      if (!response.token) {
        throw new Error('Authentication token is missing');
      }

      this.setToken(response.token);
      this.isConnected.next(response.isAuthenticated);
      this.integrationData.next(response)
      await this.router.navigate(['/data']);

      return response;
    } catch (error) {
      this.isConnected.next(false);
      this.integrationData.next(null)

      this.handleError('Error during GitHub callback handling:', error);
      throw error;
    } finally {
      this.loadingService.showOff();
    }
  }


  getOrganizations (): Observable<any> {
    return this.http.get(`${this.API_URL}/github/organizations`).pipe(
      catchError(error => this.handleError('Error fetching organizations:', error))
    );
  }


  getRepositories (org: string): Observable<any> {
    return this.http.get(`${this.API_URL}/github/organizations/${org}/repos`).pipe(
      catchError(error => this.handleError('Error fetching repositories:', error))
    );
  }


  async removeIntegration (): Promise<void> {
    this.loadingService.showOn();
    try {
      await firstValueFrom(this.http.delete(`${this.API_URL}/auth/github/integration`));
      this.clearToken();
      this.isConnected.next(false);
      this.integrationData.next(null)
      await this.router.navigate(['/auth']);


    } catch (error) {
      this.handleError('Error during integration removal:', error);
      this.isConnected.next(false);
      this.integrationData.next(null)
    } finally {
      this.loadingService.showOff();
    }
  }


  private verifyToken (): Observable<CallbackResponse> {
    return this.http.get<CallbackResponse>(`${this.API_URL}/auth/verify`).pipe(
      catchError(error => this.handleError('Token verification failed:', error))
    );
  }

  private setToken (token: string): void {
    localStorage.setItem('token', token);
    this.token.next(token);
  }


  private clearToken (): void {
    localStorage.removeItem('token');
    this.token.next(null);
  }

  /**
   * Initiate GitHub authentication (alternative to redirectToGithubAuth)
   */
  initiateGithubAuth (): void {
    this.http.get<GithubAuthUrl>(`${this.API_URL}/auth/github/url`).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (error) => {
        this.handleError('Error during GitHub authentication initiation:', error);
      },
    });
  }

  /**
   * Handle errors consistently
   */
  private handleError (message: string, error: unknown): Observable<never> {
    console.error(message, error);
    const errorMessage = error instanceof HttpErrorResponse
      ? error.error?.message || error.message
      : error instanceof Error
        ? error.message
        : 'Unknown error occurred';

    return throwError(() => new Error(`${message} ${errorMessage}`));
  }

  isAuthenticatedSync (): boolean {
    return this.isConnected.value;
  }
}
