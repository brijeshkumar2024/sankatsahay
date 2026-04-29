# Fix Blank Screen at /admin

Current status: Backend server crashing repeatedly (see dev.out.log), causing API fetches to fail → AdminPortal error/loading state appears blank.

## Steps to Complete:
1. [ ] Kill running Node.js processes on port 5000 or nodemon.
2. [ ] cd sankatsahay/server && npm install (ensure deps).
3. [ ] cd sankatsahay/server && npm run dev (confirm stable 'Server running on port 5000' no crashes).
4. [ ] Visit http://localhost:5173/admin-login, login: email=admin@sankatsahay.in password=NEXORA2025.
5. [ ] Navigate to http://localhost:5173/admin - dashboard loads.
6. [ ] [Optional] Demo data: cd sankatsahay/server && node seedDemoData.js.

**Next:** Restart server stable.
