# Frontend Requirements – Implementation Summary

## 1. Pages

- **Database Selection** (`/databases`) – List configured databases (from `GET /api/Database`), select one to continue.
- **Table Selection** (`/tables/:id`) – List tables for the chosen connection, multi-select, then "Continue to Report Builder".
- **Report Builder** (`/report-builder`) – Prompt input (e.g. "Show total sales per month"), "Generate Report" calls `POST /api/Database/query`.
- **Chart Viewer** (`/chart-viewer`) – Shows generated SQL, auto-detected chart (bar/line/pie), and dynamic table with pagination.

Default route: `/databases`. Legacy single-page reporting: `/legacy`.

## 2. Services

- **DatabaseService** (`core/services/database.service.ts`) – `getDatabases()`, `getTables(id)`, `getColumns(id, schema, table)`, `getRelationships(id, tables)`, `executeQuery(connectionId, tableNames, prompt)`.
- **ReportingService** (`core/services/reporting.service.ts`) – `executeQuery(req)` for legacy `api/Reporting/query` (string connectionId).

## 3. Report Builder flow

- User reaches Report Builder with query params `connectionId` and `tables` (from Table Selection).
- User enters prompt and clicks "Generate Report".
- Request is sent to `POST /api/Database/query` with `{ connectionId, tableNames, prompt }`.
- On success, app navigates to Chart Viewer with result in router state.

## 4. Chart Viewer

- **Auto-detect chart type**: Uses backend `suggestedChartType` (bar, line, pie, table).
- **Chart.js**: Renders bar/line/pie from first numeric column and first label column.
- **Dynamic table**: `app-dynamic-table` with `[data]` and `[cols]`, pagination (10, 25, 50, 100).

## 5. UI

- **Angular Material**: Cards, buttons, form field, input, progress spinner, snack bar, table, paginator.
- **Responsive**: Basic responsive layout and full-width forms.
- **Loading**: `LoadingSpinnerComponent` on database and table lists and during report generation.
- **Error handling**: Error message display and `MatSnackBar` for report failure.
- **Toasts**: `MatSnackBar` for "Report failed" and "Select a database and tables first."

## 6. Folder structure

- **core/** – `services/database.service.ts`, `services/reporting.service.ts`
- **shared/** – `components/loading-spinner/`, `components/dynamic-table/`
- **features/database/** – `pages/database-selection.page.ts`, `pages/table-selection.page.ts`
- **features/reporting/** – `pages/report-builder.page.ts`, `pages/chart-viewer.page.ts`
- **pages/reporting/** – Legacy single-page reporting component (route `/legacy`)

## 7. Conventions

- Standalone components.
- Reactive forms on Report Builder.
- TypeScript interfaces in services (`DatabaseConnection`, `TableInfo`, `ColumnInfo`, `DatabaseQueryResult`, etc.).
- Services provided in root; clean separation between core, shared, and feature modules.
