# Admin Button Fixes TODO

**API Communication Fixed** - Frontend now uses Vite proxy to localhost:5000.

**1. [x] Add toast system to AdminPortal.jsx**
 - Add useState for toasts array
 - Add showToast(message, type) function
 - Show toast overlay

**2. [x] Update AdminPortal handlers**
 - triggerEmergency(): showToast + loading
 - autoAssignVolunteers(): showToast + loading  
 - simulateDisaster(): showToast + loading
 - suggestRoute(): showToast + loading

**3. [x] Add loading states to Sidebar buttons**
 - Pass loading state from AdminPortal to AdminSidebar
 - Disable buttons during loading

**4. [x] API Proxy Fix**
 - Client .env: VITE_API_URL= (empty uses Vite proxy)
 - api.js: sendSimulationCommand now uses request() -> Vite proxy
 - api.js: request() has console.error for debugging

**5. [x] Backend Routes Verified**
 - /api/admin/cyclone/trigger-alert exists
 - /api/simulation/command exists
 - CORS allows http://localhost:5173

**Progress: 5/5**
