# SankatSahay Local Dev Fix TODO

## Plan Breakdown (Approved)

**Status: 6/8 complete**

### 1. [x] Create client/.env (VITE_API_URL= for proxy-only)
### 2. [x] Fix api.js: sendSimulationCommand/getSimulationState → relative /api/simulation/*
### 3. [x] Read/verify server/routes/admin.js & simulation.js handlers
### 4. [x] Add console.error logging to api catch blocks
### 5. [ ] Enhance fallback data (already exists in code)
### 6. [ ] Update TODO_BUTTON_FIXES.md → 5/5 complete
### 7. [ ] Test: Run client/server dev servers
### 8. [ ] attempt_completion with test results

**DONE:**
- .env created (empty VITE_API_URL -> uses Vite proxy)
- api.js: getSimulationState/sendSimulationCommand now use request() -> proxy to localhost:5000
- api.js: request() has console.error logging for all errors
- Backend routes verified: admin.js & simulation.js POST handlers exist

**Next:** Test both servers running

**COMPLETED:**
- Backend running on port 5000
- Frontend Vite proxy active

