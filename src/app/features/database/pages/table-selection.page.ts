import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatabaseService, type TableInfo } from '../../../core/services/database.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-table-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <h1>Table Selection</h1>
      <p class="subtitle">Select one or more tables for your report (connection #{{ connectionId() }}).</p>
      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else {
        <div class="chips">
          @for (t of tables(); track t.fullName) {
            <button
              mat-stroked-button
              [class.selected]="isSelected(t.fullName)"
              (click)="toggle(t.fullName)"
            >
              {{ t.fullName }}
            </button>
          }
        </div>
        <div class="actions">
          <button mat-flat-button color="primary" [disabled]="selected().length === 0" (click)="goToReport()">
            Continue to Report Builder
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
    .chips button.selected { background: rgba(63, 81, 181, 0.2); }
    .actions { margin-top: 1.5rem; }
  `],
})
export class TableSelectionPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private db = inject(DatabaseService);

  connectionId = signal(0);
  tables = signal<TableInfo[]>([]);
  selected = signal<string[]>([]);
  loading = signal(true);
  error = signal('');

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const numId = id ? parseInt(id, 10) : 0;
    this.connectionId.set(isNaN(numId) ? 0 : numId);
    if (this.connectionId() > 0) {
      this.db.getTables(this.connectionId()).subscribe({
        next: (list) => { this.tables.set(list); this.loading.set(false); },
        error: (e) => { this.error.set(e?.message ?? 'Failed to load tables'); this.loading.set(false); },
      });
    } else {
      this.error.set('Invalid connection');
      this.loading.set(false);
    }
  }

  isSelected(fullName: string): boolean {
    return this.selected().includes(fullName);
  }

  toggle(fullName: string): void {
    const s = this.selected();
    this.selected.set(s.includes(fullName) ? s.filter((x) => x !== fullName) : [...s, fullName]);
  }

  goToReport(): void {
    this.router.navigate(['/report-builder'], {
      queryParams: { connectionId: this.connectionId(), tables: this.selected().join(',') },
    });
  }
}
