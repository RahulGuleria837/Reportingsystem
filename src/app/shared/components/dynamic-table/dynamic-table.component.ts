import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="dataSource">
        @for (col of columns; track col) {
          <ng-container [matColumnDef]="col">
            <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
            <td mat-cell *matCellDef="let row">{{ row[col] }}</td>
          </ng-container>
        }
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
      @if (columns.length && totalRows > pageSize) {
        <mat-paginator
          [length]="totalRows"
          [pageSize]="pageSize"
          [pageIndex]="pageIndex"
          [pageSizeOptions]="[10, 25, 50, 100]"
          (page)="onPage($event)"
        >
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    th, td {
      padding: 0 0.5rem;
    }
  `],
})
export class DynamicTableComponent {
  @Input() set data(rows: Record<string, unknown>[]) {
    this._data = rows ?? [];
    this.totalRows = this._data.length;
    this.updatePage();
  }
  @Input() set cols(c: string[]) {
    this.columns = c ?? [];
  }
  @Input() pageSize = 25;

  columns: string[] = [];
  dataSource = new MatTableDataSource<Record<string, unknown>>([]);
  totalRows = 0;
  pageIndex = 0;
  private _data: Record<string, unknown>[] = [];

  private updatePage(): void {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.dataSource.data = this._data.slice(start, end);
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.updatePage();
  }
}
