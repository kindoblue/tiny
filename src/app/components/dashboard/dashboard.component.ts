import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../services/stats.service';
import { Stats } from '../../models/stats.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="stats-grid">
      @for (stat of stats(); track stat.id) {
        <mat-card class="stat-card">
          <mat-card-header>
            <mat-card-title>{{ stat.category }}</mat-card-title>
            <mat-icon [class]="getColorClass(stat.percentage)" class="trend-icon">
              {{ getTrendIcon(stat.percentage) }}
            </mat-icon>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">
              <span class="value">{{ stat.value }}</span>
              <span [class]="getColorClass(stat.percentage)" class="percentage">
                {{ formatPercentage(stat.percentage) }}
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .stat-card {
      border-radius: 8px !important;
      background: white !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
      }
    }

    .trend-icon {
      margin-left: auto;
    }

    .stat-value {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      margin-top: 1rem;
    }

    .value {
      font-size: 2rem;
      font-weight: 500;
    }

    .percentage {
      font-size: 1rem;
    }

    .success-text {
      color: #4caf50;
    }

    .error-text {
      color: #f44336;
    }

    .neutral-text {
      color: #9e9e9e;
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal<Stats[]>([]);

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.statsService.getStats().subscribe((data) => {
      this.stats.set(data);
    });
  }

  getTrend(percentage: string): 'up' | 'down' | 'stable' {
    const value = parseFloat(percentage);
    if (value > 4) return 'up';
    if (value <= 4) return 'down';
    return 'stable';
  }

  getColorClass(percentage: string): string {
    const trend = this.getTrend(percentage);
    switch (trend) {
      case 'up':
        return 'success-text';
      case 'down':
        return 'error-text';
      default:
        return 'neutral-text';
    }
  }

  getTrendIcon(percentage: string): string {
    const trend = this.getTrend(percentage);
    switch (trend) {
      case 'up':
        return 'arrow_upward';
      case 'down':
        return 'arrow_downward';
      default:
        return 'remove';
    }
  }

  formatPercentage(value: string): string {
    const num = parseFloat(value);
    return num >= 0 ? `+${value}%` : `${value}%`;
  }
} 