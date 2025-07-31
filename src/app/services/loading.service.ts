import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private loadingCount = 0;
  private _isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this._isLoading.asObservable();

  show() {
    this.loadingCount++;
    this._isLoading.next(true);
  }

  hide() {
    this.loadingCount = Math.max(this.loadingCount - 1, 0);
    if (this.loadingCount === 0) {
      this._isLoading.next(false);
    }
  }
}
