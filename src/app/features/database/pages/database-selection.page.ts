import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatabaseService, type DatabaseConnection } from '../../../core/services/database.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-database-selection',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <h1>Database Selection</h1>
      <p class="subtitle">Choose a database connection to explore tables and build reports.</p>
      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else {
        <div class="card-list">
          @for (db of databases(); track db.id) {
            <mat-card class="db-card">
              <mat-card-header>
                <mat-card-title>{{ db.name }}</mat-card-title>
                <mat-card-subtitle>Provider: {{ db.provider }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-actions>
                <button mat-flat-button color="primary" (click)="select(db.id)">Select</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
        @if (databases().length === 0 && !loading()) {
          <p class="empty">No databases configured.</p>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1 { margin-bottom: 0.5rem; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .error { color: #c62828; }
    .empty { color: #666; }
    .card-list { display: flex; flex-direction: column; gap: 1rem; }
    .db-card { flex: 1; }
  `],
})
export class DatabaseSelectionPage {
  private db = inject(DatabaseService);
  private router = inject(Router);

  databases = signal<DatabaseConnection[]>([]);
  loading = signal(true);
  error = signal('');

  constructor() {
    this.db.getDatabases().subscribe({
      next: (list) => { this.databases.set(list); this.loading.set(false); },
      error: (e) => { this.error.set(e?.message ?? 'Failed to load databases'); this.loading.set(false); },
    });
  }

  select(id: number): void {
    this.router.navigate(['/tables', id]);
  }
}
