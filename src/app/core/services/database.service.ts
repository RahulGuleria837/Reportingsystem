import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DatabaseConnection {
  id: number;
  name: string;
  provider: string;
  connectionString?: string;
}

export interface TableInfo {
  schemaName: string;
  tableName: string;
  fullName: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
}

export interface RelationshipInfo {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  isFromForeignKey: boolean;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private readonly base = `${environment.apiUrl}/api/Database`;

  constructor(private http: HttpClient) {}

  getDatabases(): Observable<DatabaseConnection[]> {
    return this.http.get<DatabaseConnection[]>(this.base).pipe(
      map((list) => list ?? [])
    );
  }

  getTables(connectionId: number): Observable<TableInfo[]> {
    return this.http.get<(TableInfo & { fullName?: string })[]>(`${this.base}/${connectionId}/tables`).pipe(
      map((list) => (list ?? []).map((t) => ({
        schemaName: t.schemaName,
        tableName: t.tableName,
        fullName: t.fullName ?? (t.schemaName ? `${t.schemaName}.${t.tableName}` : t.tableName),
      })))
    );
  }

  getColumns(connectionId: number, schemaName: string, tableName: string): Observable<ColumnInfo[]> {
    return this.http.get<ColumnInfo[]>(`${this.base}/${connectionId}/columns`, {
      params: { schemaName: schemaName || 'dbo', tableName },
    }).pipe(map((list) => list ?? []));
  }

  getRelationships(connectionId: number, tables: string[]): Observable<RelationshipInfo[]> {
    return this.http.get<RelationshipInfo[]>(`${this.base}/${connectionId}/relationships`, {
      params: { tables },
    }).pipe(map((list) => list ?? []));
  }

  executeQuery(connectionId: number, tableNames: string[], prompt: string): Observable<DatabaseQueryResult> {
    return this.http.post<DatabaseQueryResult>(`${this.base}/query`, {
      connectionId,
      tableNames,
      prompt,
    }).pipe(
      map((r) => ({
        success: r?.success ?? false,
        error: r?.error,
        generatedSql: r?.generatedSql,
        suggestedChartType: r?.suggestedChartType ?? 'table',
        columns: r?.columns ?? [],
        rows: r?.rows ?? [],
      }))
    );
  }
}

export interface DatabaseQueryResult {
  success: boolean;
  error?: string;
  generatedSql?: string;
  suggestedChartType: string;
  columns: string[];
  rows: Record<string, unknown>[];
}
