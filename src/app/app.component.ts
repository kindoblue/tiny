import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from './services/stats.service';
import { Stats } from './models/stats.interface';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule,
    MatButtonModule,
    FooterComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  stats = signal<Stats[]>([]);
  loading = signal<boolean>(true);

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading.set(true);
    this.statsService.getStats().subscribe((data) => {
      this.stats.set(data);
      this.loading.set(false);
    });
  }

  refreshData() {
    this.loadStats();
  }

  getTrend(percentage: string): 'up' | 'down' | 'stable' {
    const value = parseFloat(percentage);
    if (value > 0) return 'up';
    if (value < 0) return 'down';
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
