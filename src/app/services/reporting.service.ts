import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DbConnectionInfo {
  id: string;
  name: string;
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

export interface QueryRequest {
  connectionId: string;
  tableNames: string[];
  prompt: string;
}

export interface QueryResponse {
  success: boolean;
  error?: string;
  generatedSql?: string;
  suggestedChartType: string;
  data: Record<string, unknown>[];
  columns: string[];
}

@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly base = `${environment.apiUrl}/api/Reporting`;

  constructor(private http: HttpClient) {}

  getConnections(): Observable<DbConnectionInfo[]> {
    return this.http
      .get<{ id: string; name: string }[]>(`${this.base}/connections`)
      .pipe(
        map((list) =>
          list.map((c) => ({ id: c.id, name: c.name }))
        )
      );
  }

  getTables(connectionId: string): Observable<TableInfo[]> {
    return this.http
      .get<{ schemaName: string; tableName: string; fullName: string }[]>(
        `${this.base}/tables`,
        { params: { connectionId } }
      )
      .pipe(
        map((list) =>
          list.map((t) => ({
            schemaName: t.schemaName,
            tableName: t.tableName,
            fullName: t.fullName ?? (t.schemaName ? `${t.schemaName}.${t.tableName}` : t.tableName),
          }))
        )
      );
  }

  getColumns(
    connectionId: string,
    schemaName: string,
    tableName: string
  ): Observable<ColumnInfo[]> {
    return this.http.get<{ columnName: string; dataType: string }[]>(
      `${this.base}/columns`,
      {
        params: {
          connectionId,
          schemaName: schemaName || 'dbo',
          tableName,
        },
      }
    ).pipe(
      map((list) =>
        list.map((c) => ({ columnName: c.columnName, dataType: c.dataType }))
      )
    );
  }

  executeQuery(req: QueryRequest): Observable<QueryResponse> {
    const body = {
      connectionId: req.connectionId,
      tableNames: req.tableNames,
      prompt: req.prompt,
    };
    return this.http.post<QueryResponse>(`${this.base}/query`, body).pipe(
      map((r) => ({
        success: r.success,
        error: r.error,
        generatedSql: r.generatedSql,
        suggestedChartType: r.suggestedChartType ?? 'table',
        data: r.data ?? [],
        columns: r.columns ?? [],
      }))
    );
  }
}
