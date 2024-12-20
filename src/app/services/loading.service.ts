import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private _isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this._isLoading.asObservable();

  showOn(): void {
    this._isLoading.next(true);
  }

  showOff(): void {
    this._isLoading.next(false);
  }
}
