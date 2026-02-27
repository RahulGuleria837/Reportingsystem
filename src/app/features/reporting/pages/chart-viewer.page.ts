import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DynamicTableComponent } from '../../../shared/components/dynamic-table/dynamic-table.component';
import type { DatabaseQueryResult } from '../../../core/services/database.service';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-viewer',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, DynamicTableComponent],
  template: `
    <div class="page">
      <h1>Chart Viewer</h1>
      @if (!result()) {
        <p>No report data. <a routerLink="/databases">Start from database selection</a>.</p>
      } @else {
        @if (result()!.generatedSql) {
          <mat-card class="sql-card">
            <mat-card-header><mat-card-title>Generated SQL</mat-card-title></mat-card-header>
            <mat-card-content><pre>{{ result()!.generatedSql }}</pre></mat-card-content>
          </mat-card>
        }
        @if (chartConfig(); as config) {
          <div class="chart-wrap">
            <canvas #chartCanvas></canvas>
          </div>
        }
        @if (result()!.columns?.length && (result()!.suggestedChartType === 'table' || !chartConfig())) {
          <app-dynamic-table [data]="result()!.rows" [cols]="result()!.columns"></app-dynamic-table>
        }
        <div class="actions">
          <button mat-flat-button (click)="back()">Back to Report Builder</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; padding: 2rem; }
    .sql-card pre { overflow-x: auto; font-size: 0.85rem; }
    .chart-wrap { height: 360px; margin: 1.5rem 0; }
    .actions { margin-top: 1.5rem; }
  `],
})
export class ChartViewerPage implements AfterViewChecked {
  private router = inject(Router);

  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  result = signal<DatabaseQueryResult | null>(null);
  chartConfig = signal<ChartConfiguration<'bar' | 'line' | 'pie'> | null>(null);
  private chartInstance: Chart | null = null;
  private chartRendered = false;

  constructor() {
    const state = history.state as { result?: DatabaseQueryResult };
    const res = state?.result;
    if (res) {
      this.result.set(res);
      this.buildChart(res);
    }
  }

  ngAfterViewChecked(): void {
    if (this.chartConfig() && this.chartCanvas?.nativeElement && !this.chartRendered) {
      this.chartRendered = true;
      this.renderChart();
    }
  }

  private buildChart(res: DatabaseQueryResult): void {
    if (!res.columns?.length || !res.rows?.length) return;

    const cols = res.columns;
    const rows = res.rows;

    // Find a numeric column; if none, we fall back to table-only.
    const numericCol = cols.find((c) => typeof rows[0]?.[c] === 'number');
    if (!numericCol) {
      return;
    }

    // Prefer a different label column when possible; otherwise reuse the first column.
    const labelCol = cols.find((c) => c !== numericCol) ?? cols[0];

    // Decide chart type: trust backend hint when it's pie/line, otherwise choose based on row count.
    const type =
      res.suggestedChartType === 'pie'
        ? 'pie'
        : res.suggestedChartType === 'line'
        ? 'line'
        : rows.length <= 8
        ? 'pie'
        : 'bar';

    const labels = rows.map((r) => String(r[labelCol] ?? ''));
    const values = rows.map((r) => Number(r[numericCol]) || 0);

    this.chartConfig.set({
      type,
      data: {
        labels,
        datasets: [
          {
            label: numericCol,
            data: values,
            backgroundColor: 'rgba(63, 81, 181, 0.8)',
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    });
  }

  private renderChart(): void {
    const config = this.chartConfig();
    const canvas = this.chartCanvas?.nativeElement;
    if (canvas && config) {
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(canvas, config);
    }
  }

  back(): void {
    this.router.navigate(['/report-builder']);
  }
}
