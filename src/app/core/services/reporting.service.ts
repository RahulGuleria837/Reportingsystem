import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

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

  executeQuery(req: QueryRequest): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(`${this.base}/query`, req).pipe(
      map((r) => ({
        success: r.success ?? false,
        error: r.error,
        generatedSql: r.generatedSql,
        suggestedChartType: r.suggestedChartType ?? 'table',
        data: r.data ?? [],
        columns: r.columns ?? [],
      }))
    );
  }
}
