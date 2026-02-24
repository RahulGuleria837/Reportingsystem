import { Component, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, type ChartConfiguration } from 'chart.js';
import {
  ReportingService,
  type DbConnectionInfo,
  type TableInfo,
  type QueryResponse,
} from '../../services/reporting.service';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporting.component.html',
  styleUrl: './reporting.component.scss',
})
export class ReportingComponent {
  private reporting = inject(ReportingService);

  connections = signal<DbConnectionInfo[]>([]);
  tables = signal<TableInfo[]>([]);
  selectedConnectionId = signal<string>('');
  selectedTableNames = signal<string[]>([]);
  prompt = signal<string>('');
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<QueryResponse | null>(null);

  chartConfig = signal<ChartConfiguration<'bar' | 'line' | 'pie' | 'doughnut'> | null>(null);
  private chartInstance: Chart | null = null;
  @ViewChild('chartCanvas') chartCanvas?: ElementRef<HTMLCanvasElement>;

  constructor() {
    this.reporting.getConnections().subscribe({
      next: (list) => this.connections.set(list),
      error: (err) => this.error.set(err?.message ?? 'Failed to load connections'),
    });
  }

  onConnectionChange(connectionId: string): void {
    this.selectedConnectionId.set(connectionId);
    this.selectedTableNames.set([]);
    this.result.set(null);
    this.chartConfig.set(null);
    if (!connectionId) {
      this.tables.set([]);
      return;
    }
    this.reporting.getTables(connectionId).subscribe({
      next: (list) => this.tables.set(list),
      error: (err) => this.error.set(err?.message ?? 'Failed to load tables'),
    });
  }

  toggleTable(fullName: string): void {
    const current = this.selectedTableNames();
    const next = current.includes(fullName)
      ? current.filter((t) => t !== fullName)
      : [...current, fullName];
    this.selectedTableNames.set(next);
  }

  isTableSelected(fullName: string): boolean {
    return this.selectedTableNames().includes(fullName);
  }

  runQuery(): void {
    const connectionId = this.selectedConnectionId();
    const tableNames = this.selectedTableNames();
    const promptText = this.prompt().trim();
    if (!connectionId || tableNames.length === 0) {
      this.error.set('Select a connection and at least one table.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    this.chartConfig.set(null);

    this.reporting
      .executeQuery({
        connectionId,
        tableNames,
        prompt: promptText || 'Show me the data',
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          this.result.set(res);
          this.buildChartConfig(res);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.error ?? err?.message ?? 'Query failed');
        },
      });
  }

  private buildChartConfig(res: QueryResponse): void {
    const cols = res.columns ?? [];
    const data = res.data ?? [];
    if (data.length === 0 || cols.length === 0) {
      this.chartConfig.set(null);
      return;
    }

    const suggested = res.suggestedChartType || 'table';
    if (suggested === 'table') {
      this.chartConfig.set(null);
      return;
    }
    const type = suggested as 'bar' | 'line' | 'pie' | 'doughnut';

    const labelCol = cols.find((c) => {
      const v = data[0]?.[c];
      return v != null && typeof v !== 'object' && (typeof v === 'string' || typeof v === 'number');
    }) ?? cols[0];
    const valueCol = cols.find((c) => c !== labelCol && typeof data[0]?.[c] === 'number') ?? cols[1];

    const labels = data.map((r) => String(r[labelCol] ?? ''));
    const values = data.map((r) => Number(r[valueCol]) || 0);

    const colors = [
      'rgba(99, 132, 255, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(75, 192, 192, 0.8)',
      'rgba(255, 205, 86, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(54, 162, 235, 0.8)',
    ];

    const config: ChartConfiguration<'bar' | 'line' | 'pie' | 'doughnut'> = {
      type: type === 'pie' ? 'pie' : type === 'line' ? 'line' : 'bar',
      data: {
        labels,
        datasets: [
          {
            label: valueCol,
            data: values,
            backgroundColor: type === 'pie' || type === 'doughnut' ? colors : colors[0],
            borderColor: type === 'line' ? colors[0] : undefined,
            fill: type === 'line',
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: type === 'pie' || type === 'doughnut' },
        },
        scales: type === 'bar' || type === 'line'
          ? {
              y: { beginAtZero: true },
              x: { display: true },
            }
          : undefined,
      },
    };

    this.chartConfig.set(config);
    this.renderChart(config);
  }

  private renderChart(config: ChartConfiguration<'bar' | 'line' | 'pie' | 'doughnut'>): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    setTimeout(() => {
      const canvas = this.chartCanvas?.nativeElement;
      if (canvas && config) {
        this.chartInstance = new Chart(canvas, config);
      }
    }, 0);
  }
}
