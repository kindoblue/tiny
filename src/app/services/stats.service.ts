import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { Stats } from '../models/stats.interface';

export interface EnhancedStats extends Stats {
  trend: 'up' | 'down' | 'stable';
  numericValue: number;
  numericPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = 'https://67a312a2409de5ed52574908.mockapi.io/stats';

  constructor(private http: HttpClient) {}

  getStats(): Observable<EnhancedStats[]> {
    return this.http.get<Stats[]>(this.apiUrl).pipe(
      map(response => this.transformResponse(response)),
      catchError(error => {
        console.error('Error fetching stats:', error);
        // Fallback to mock data in case of error
        return of(this.getFallbackData());
      })
    );
  }

  private transformResponse(response: Stats[]): EnhancedStats[] {
    return response.map(item => {
      const numericValue = parseFloat(item.value);
      const numericPercentage = parseFloat(item.percentage);
      
      return {
        ...item,
        numericValue,
        numericPercentage,
        trend: this.calculateTrend(numericPercentage)
      };
    });
  }

  private calculateTrend(percentage: number): 'up' | 'down' | 'stable' {
    if (percentage > 0) return 'up';
    if (percentage < 0) return 'down';
    return 'stable';
  }

  private getFallbackData(): EnhancedStats[] {
    return [
      {
        id: '1',
        category: 'Wagon',
        value: '3',
        percentage: '4',
        numericValue: 3,
        numericPercentage: 4,
        trend: 'up'
      },
      {
        id: '2',
        category: 'Cargo Van',
        value: '6',
        percentage: '1',
        numericValue: 6,
        numericPercentage: 1,
        trend: 'up'
      }
    ];
  }
} 