# AI-Powered Dynamic Reporting

This app implements the flow from your wireframe: **natural language prompt → AI query → safe SQL → data → best-fit chart**.

## How it works

1. **Select a database** from the connections configured in the backend.
2. **Select one or more tables** to query.
3. **Enter a natural language prompt** (e.g. “Show monthly revenue by city where payment is paid”).
4. **Generate report** – the backend either uses **OpenAI** (if configured) to generate T-SQL from your prompt and schema, or runs a safe fallback `SELECT TOP 100 *` from the first table.
5. **Safe SQL** – only `SELECT` on the chosen tables is allowed; other statements are rejected.
6. **Chart selection** – the backend suggests **bar**, **line**, **pie**, or **table** from the result shape; the Angular app renders the chart or table.

## Backend (ASP.NET Core)

- **Location:** `D:\ReportingServer\ReportingSystem\ReportingSystem`
- **Connection string:** Configured in `appsettings.Development.json` under `Reporting:Connections`. Your **Damico_CommonLogin** connection is already added there. For production, use User Secrets or environment variables instead of storing passwords in config.
- **Optional AI:** To use natural language → SQL, set `Reporting:OpenAIApiKey` in config (e.g. User Secrets) to your OpenAI API key. If not set, the app uses the fallback query only.
- **Endpoints:**
  - `GET /api/reporting/connections` – list configured DB connections
  - `GET /api/reporting/tables?connectionId=...` – list tables
  - `GET /api/reporting/columns?connectionId=...&schemaName=...&tableName=...` – list columns
  - `POST /api/reporting/query` – body: `{ "connectionId", "tableNames": [], "prompt" }` → returns `{ "data", "columns", "suggestedChartType", "generatedSql" }`

Run the API (e.g. from `ReportingSystem` folder):

```bash
dotnet run
```

By default it listens on `http://localhost:5276` (and HTTPS on 7254).

## Frontend (Angular)

- **Location:** `D:\ReportingServer\FrontEnd\dynamicReporting`
- **API URL:** `src/environments/environment.ts` → `apiUrl: 'http://localhost:5276'`. Change for production.
- **Install & run:**

```bash
npm install --legacy-peer-deps
npm start
```

Open `http://localhost:4200`. The reporting page is the default route.

## Adding more databases

In the backend `appsettings.Development.json` (or production config), add entries to `Reporting:Connections`:

```json
"Connections": [
  {
    "Id": "Damico_CommonLogin",
    "Name": "Damico Common Login",
    "ConnectionString": "Server=...;Database=...;User ID=...;Password=...;..."
  },
  {
    "Id": "AnotherDb",
    "Name": "Another Database",
    "ConnectionString": "..."
  }
]
```

They will appear in the “Database connection” dropdown in the UI.

## Security note

Do not commit real connection strings or API keys. Use User Secrets (`dotnet user-secrets set "Reporting:OpenAIApiKey" "sk-..."`) or environment variables in production.
