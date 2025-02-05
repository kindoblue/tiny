import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatsService, EnhancedStats } from './services/stats.service';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDividerModule,
    MatToolbarModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  stats = signal<EnhancedStats[]>([]);
  loading = signal<boolean>(true);

  constructor(private statsService: StatsService) {}

  ngOnInit() {
    this.statsService.getStats().subscribe(data => {
      this.stats.set(data);
      this.loading.set(false);
    });
  }

  getColorClass(trend: string): string {
    switch (trend) {
      case 'up':
        return 'success-text';
      case 'down':
        return 'error-text';
      default:
        return 'neutral-text';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      default:
        return 'trending_flat';
    }
  }
}
