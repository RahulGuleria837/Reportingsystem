import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatabaseService } from '../../../core/services/database.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
  ],
  template: `
    <div class="page">
      <h1>Report Builder</h1>
      <p class="subtitle">Enter a natural language prompt to generate a report (e.g. "Show total sales per month").</p>
      <form [formGroup]="form" (ngSubmit)="run()">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Prompt</mat-label>
          <textarea matInput formControlName="prompt" rows="3" placeholder="e.g. Show total sales per month"></textarea>
        </mat-form-field>
        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="loading() || !form.valid">
            {{ loading() ? 'Running…' : 'Generate Report' }}
          </button>
        </div>
      </form>
      @if (loading()) {
        <app-loading-spinner></app-loading-spinner>
      }
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 700px; margin: 0 auto; padding: 2rem; }
    .full-width { width: 100%; }
    .actions { margin-top: 1rem; }
    .error { color: #c62828; }
  `],
})
export class ReportBuilderPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private db = inject(DatabaseService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  connectionId = signal(0);
  tableNames = signal<string[]>([]);
  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    prompt: ['', [Validators.required]],
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    this.connectionId.set(parseInt(q.get('connectionId') ?? '0', 10) || 0);
    const tables = q.get('tables');
    this.tableNames.set(tables ? tables.split(',').filter(Boolean) : []);
  }

  run(): void {
    const connId = this.connectionId();
    const tables = this.tableNames();
    const prompt = this.form.get('prompt')?.value?.trim() ?? '';
    if (!connId || tables.length === 0) {
      this.snackBar.open('Select a database and tables first.', 'Close', { duration: 3000 });
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.db.executeQuery(connId, tables, prompt).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/chart-viewer'], { state: { result: res } });
        } else {
          this.error.set(res.error ?? 'Request failed');
        }
      },
      error: (e) => {
        this.loading.set(false);
        this.error.set(e?.error?.error ?? e?.message ?? 'Request failed');
        this.snackBar.open('Report failed', 'Close', { duration: 3000 });
      },
    });
  }
}
