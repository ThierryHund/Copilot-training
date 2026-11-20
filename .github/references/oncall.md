# Photo Gallery On-Call Guide

## On-Call Responsibilities

- **Response Time**: Acknowledge within 15 minutes
- **Initial Triage**: Begin investigation within 30 minutes
- **Escalation**: Contact tech lead if unresolved after 1 hour

---

## Incident Severity Levels

### P0 - Critical (Production Down)
- **Response**: Immediate (page via phone)
- **Impact**: Complete service outage
- **Examples**: Database offline, API unreachable
- **Escalation**: Immediate tech lead + CTO notification

### P1 - High (Major Feature Broken)
- **Response**: Within 15 minutes
- **Impact**: Critical feature broken for 50%+ users
- **Examples**: Photo uploads failing, login broken
- **Escalation**: Tech lead after 30 minutes

### P2 - Medium (Degraded Experience)
- **Response**: Within 1 hour
- **Impact**: Slow performance, minor features broken
- **Examples**: Slow page loads, thumbnail generation delayed
- **Escalation**: Next business day unless ongoing >4 hours

### P3 - Low (Minor Issue)
- **Response**: Next business day
- **Impact**: Non-user-facing issues
- **Examples**: Logging errors, internal tools slow
- **Escalation**: Optional, via Slack

---

## Common Incidents & Resolutions

### 1. Database Connection Issues (SQLite)

**Symptoms**:
```
ERROR: SQLITE_BUSY: database is locked
ERROR: SQLITE_CANTOPEN: unable to open database file
```

**Triage** — the SQLite file lives in a different path per backend:

<details>
<summary><strong>NestJS</strong> — <code>dist/db/photogallery.db</code></summary>

```bash
ls -la ./dist/db/photogallery.db
ls -la ./dist/db/*.lock 2>/dev/null
df -h ./dist/db/
```

Restart: `npm run serve:backend-nestjs` (or `nx serve backend-nestjs`).

</details>

<details>
<summary><strong>Spring Boot</strong> — <code>data/photogallery.db</code></summary>

```bash
ls -la apps/backend-spring/data/photogallery.db
df -h apps/backend-spring/data/
```

Restart: `cd apps/backend-spring && ./mvnw spring-boot:run` (Ctrl+C then re-run, or use Spring DevTools hot restart).

</details>

<details>
<summary><strong>FastAPI</strong> — <code>db/photos.sqlite</code> (default; overridable via <code>FASTAPI_DB_DIR</code>)</summary>

```bash
ls -la apps/backend-fastapi/db/photos.sqlite
df -h apps/backend-fastapi/db/
```

Restart: stop the `uvicorn` process and `npm run serve:backend-fastapi`.

</details>

<details>
<summary><strong>.NET</strong> — <code>data/photogallery.db</code> (relative to the project directory)</summary>

```bash
ls -la apps/backend-dotnet/data/photogallery.db
df -h apps/backend-dotnet/data/
```

Restart: stop the `dotnet run` process (Ctrl+C), then `npm run serve:backend-dotnet`.

</details>

<details>
<summary><strong>Gin</strong> — <code>db/photos.db</code> (relative to CWD)</summary>

```bash
ls -la apps/backend-gin/db/photos.db
df -h apps/backend-gin/db/
```

Restart: stop the `go run` process and `npm run serve:backend-gin`.

</details>

**Resolution** (all backends):
- If database locked: restart the backend service
- If file missing: the backend recreates it on next startup (auto-migrate is enabled in all four)
- If disk full: clear old uploads or increase disk space

---

### 2. File Upload Failures

**Symptoms**:
```
ERROR: File upload failed
ERROR: ENOENT: no such file or directory
ERROR: ENOSPC: no space left on device
```

**Triage** — the uploads directory lives at `./uploads/` relative to the running backend's CWD (or `./dist/uploads/` for NestJS, because its build emits to `dist/`):

```bash
# NestJS (running from workspace root via nx)
ls -la ./dist/uploads/ && df -h ./dist/uploads/

# Spring Boot / FastAPI / Gin (running from apps/backend-<x>)
ls -la apps/backend-<x>/uploads/ && df -h apps/backend-<x>/uploads/

# Recent uploads
ls -lt <uploads-dir> | head -20
```

**Resolution**:
- If directory missing: the backend auto-creates it on first upload; otherwise `mkdir -p <uploads-dir>`
- If permissions issue: `chmod 755 <uploads-dir>`
- If disk full: clean old uploads or increase disk space
- If upload fails validation: check file size (<5MB) and type (JPEG/PNG/GIF/WebP)

---

### 3. High API Latency

**Symptoms**:
- Response times >2s for simple endpoints
- User complaints of slow page loads

**Triage**:
```bash
# Check backend service is running (port 42621, same for all backends)
curl -s http://localhost:42621/api/photos | head

# Check service logs — tail your backend's stdout

# Check DB file size (path depends on backend — see incident #1 above)

# Check CPU/memory usage for your backend's process:
#   NestJS:      top -bn1 | grep node
#   Spring Boot: top -bn1 | grep java
#   FastAPI:     top -bn1 | grep uvicorn
#   .NET:        top -bn1 | grep dotnet
#   Gin:         top -bn1 | grep backend-gin
```

**Resolution**:
- Add database indexes for slow queries
- Optimize large queries (pagination, limiting results)
- Check for N+1 query patterns in code
- Restart backend service if memory leak suspected

---

### 4. Frontend Loading Issues

**Symptoms**:
- Blank page or loading spinner stuck
- Network errors in browser console

**Triage**:
```bash
# Check frontend is running
curl -s http://localhost:42620 | head

# Check API proxy is working
curl -s http://localhost:42620/api/photos

# Check backend is accessible (whichever backend is running — all bind 42621)
curl -s http://localhost:42621/api/photos

# Verify proxy configuration
cat apps/frontend/proxy.conf.json
```

**Resolution**:
- Ensure backend is running on port 3000
- Verify `proxy.conf.json` points to correct backend URL
- Check browser console for CORS or network errors
- Restart frontend service (`nx serve frontend`)

---

## Monitoring & Debugging

### Key Log Locations

- **Backend Logs**: terminal running your backend process (see commands below per stack)
- **Frontend Logs**: Browser DevTools → Console
- **Network Requests**: Browser DevTools → Network tab
- **Database**: path depends on backend — see incident #1

### Useful Commands

Frontend (always):

```bash
npm run serve                          # or: nx serve frontend   (port 42620)
nx build frontend
nx test frontend
```

Backend (pick your stack):

<details>
<summary><strong>NestJS</strong></summary>

```bash
npm run serve:backend-nestjs           # nx serve backend-nestjs (port 42621)
nx build backend-nestjs
nx test backend-nestjs
```

</details>

<details>
<summary><strong>Spring Boot</strong></summary>

```bash
cd apps/backend-spring
./mvnw spring-boot:run                 # port 42621
./mvnw package
./mvnw test
```

</details>

<details>
<summary><strong>FastAPI</strong></summary>

```bash
cd apps/backend-fastapi
uv sync
uvicorn app.main:app --host 0.0.0.0 --port 42621 --reload
uv run pytest
```

</details>

<details>
<summary><strong>.NET</strong></summary>

```bash
cd apps/backend-dotnet
dotnet run                             # port 42621
dotnet build -c Release
dotnet test
```

</details>

<details>
<summary><strong>Gin</strong></summary>

```bash
cd apps/backend-gin
go run ./cmd/server                    # port 42621
go build -o bin/server ./cmd/server
go test ./...
```

</details>

### Key Metrics to Monitor

- **API Error Rate**: Should be <1%
- **P99 Latency**: Should be <500ms
- **Upload Success Rate**: Should be >99%
- **Database Size**: Monitor growth of SQLite file

---

## Escalation Contacts

| Role | Contact | Slack | When to Escalate |
|------|---------|-------|------------------|
| **Tech Lead** | Alice Smith | @alice | P0/P1 incidents, unresolved after 30 min |
| **Backend Team** | Backend On-Call | #backend-oncall | API, database issues |
| **Frontend Team** | Frontend On-Call | #frontend-oncall | UI, component issues |
| **CTO** | Charlie Johnson | @charlie | P0 incidents, data breach, revenue impact |

---

## Post-Incident

### Root Cause Analysis (RCA)

Template: `docs/runbooks/rca-template.md`

**Required within 48 hours** for P0/P1 incidents:
1. Timeline of events
2. Root cause identified
3. Immediate mitigation steps taken
4. Long-term prevention plan
5. Action items assigned

### Post-Mortem Meeting

- Schedule within 1 week
- Blameless culture (focus on systems, not people)
- Document learnings and improvements

---

## Runbook Index

- [Database Connection Issues](docs/runbooks/database-connection.md)
- [File Upload Failures](docs/runbooks/upload-failures.md)
- [API Latency Debugging](docs/runbooks/api-latency.md)
- [Frontend Issues](docs/runbooks/frontend-issues.md)

---

## Emergency Commands

### Restart Backend Service

Stop the running backend (Ctrl+C) and re-run its start command — see "Useful Commands" above for the stack-specific invocation.

### Reset Database

The DB path and restart command depend on your backend. Backup first, delete the file, restart — every backend auto-creates a fresh DB on startup.

<details>
<summary><strong>NestJS</strong></summary>

```bash
cp ./dist/db/photogallery.db ./dist/db/photogallery.db.backup
rm ./dist/db/photogallery.db
npm run serve:backend-nestjs
```

</details>

<details>
<summary><strong>Spring Boot</strong></summary>

```bash
cp apps/backend-spring/data/photogallery.db apps/backend-spring/data/photogallery.db.backup
rm apps/backend-spring/data/photogallery.db
cd apps/backend-spring && ./mvnw spring-boot:run
```

</details>

<details>
<summary><strong>FastAPI</strong></summary>

```bash
cp apps/backend-fastapi/db/photos.sqlite apps/backend-fastapi/db/photos.sqlite.backup
rm apps/backend-fastapi/db/photos.sqlite
npm run serve:backend-fastapi
```

</details>

<details>
<summary><strong>.NET</strong></summary>

```bash
cp apps/backend-dotnet/data/photogallery.db apps/backend-dotnet/data/photogallery.db.backup
rm apps/backend-dotnet/data/photogallery.db
npm run serve:backend-dotnet
```

</details>

<details>
<summary><strong>Gin</strong></summary>

```bash
cp apps/backend-gin/db/photos.db apps/backend-gin/db/photos.db.backup
rm apps/backend-gin/db/photos.db
npm run serve:backend-gin
```

</details>

### Clear Uploads Directory

`./uploads/` relative to the running backend's CWD. NestJS uses `./dist/uploads/`; the other three use `apps/backend-<x>/uploads/`. Backup with `cp -r`, then `rm -rf <path>/*`.

### Rebuild Application

```bash
# Node side: clean and rebuild frontend + NestJS backend
rm -rf dist/
nx build frontend
nx build backend-nestjs

# Spring Boot:   cd apps/backend-spring && ./mvnw clean package
# FastAPI:       no build step (Python is interpreted)
# .NET:          cd apps/backend-dotnet && dotnet build -c Release
# Gin:           cd apps/backend-gin && go build ./cmd/server
```

---

## References

- [architecture.md](architecture.md)
- [domain-glossary.md](domain-glossary.md)
- [testing-guidelines.md](testing-guidelines.md)
