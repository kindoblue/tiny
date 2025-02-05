import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { Stats } from '../models/stats.interface';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'https://67a312a2409de5ed52574908.mockapi.io/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<Stats[]> {
    return this.http.get<Stats[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching stats:', error);
        return of(this.getFallbackData());
      })
    );
  }

  private getFallbackData(): Stats[] {
    return [
      {
        id: '1',
        category: 'Wagon',
        value: '3',
        percentage: '4'
      },
      {
        id: '2',
        category: 'Cargo Van',
        value: '6',
        percentage: '1'
      }
    ];
  }
} 