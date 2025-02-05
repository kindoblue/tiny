import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService } from './services/stats.service';
import { Stats } from './models/stats.interface';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { FooterComponent } from './components/footer/footer.component';

/**
 * AppComponent is the main container component for the dashboard.
 * It loads and displays statistics fetched from the StatsService.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
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

  /**
   * Creates an instance of AppComponent.
   * @param statsService - Service to fetch statistics.
   */
  constructor(private statsService: StatsService) {}

  /**
   * Lifecycle hook that is called after data-bound properties are initialized.
   */
  ngOnInit() {
    this.loadStats();
  }

  /**
   * Loads the statistics by calling the StatsService and updating the state.
   */
  loadStats() {
    this.loading.set(true);
    this.statsService.getStats().subscribe((data) => {
      this.stats.set(data);
      this.loading.set(false);
    });
  }

  /**
   * Refreshes the statistics data by invoking loadStats.
   */
  refreshData() {
    this.loadStats();
  }

  /**
   * Determines the trend based on the percentage value.
   * @param percentage - The percentage value as a string.
   * @returns 'up' if value > 4, 'down' if value is less than or equal to 4, otherwise 'stable'.
   */
  getTrend(percentage: string): 'up' | 'down' | 'stable' {
    const value = parseFloat(percentage);
    if (value > 4) return 'up';
    if (value <= 4) return 'down';
    return 'stable';
  }

  /**
   * Returns the CSS class corresponding to the trend.
   * @param percentage - The percentage value as a string.
   * @returns 'success-text', 'error-text', or 'neutral-text' based on the trend.
   */
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

  /**
   * Returns the icon name corresponding to the trend.
   * @param percentage - The percentage value as a string.
   * @returns 'arrow_upward', 'arrow_downward', or 'remove' based on the trend.
   */
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

  /**
   * Formats the percentage value by prefixing a '+' sign if non-negative.
   * @param value - The percentage value as a string.
   * @returns The formatted percentage string.
   */
  formatPercentage(value: string): string {
    const num = parseFloat(value);
    return num >= 0 ? `+${value}%` : `${value}%`;
  }
}
