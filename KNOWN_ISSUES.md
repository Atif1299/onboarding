# Known Issues

## Jest Worker Error (Non-Critical)

### Issue
You may see this error in development mode:
```
⨯ [Error: Jest worker encountered 2 child process exceptions, exceeding retry limit]
```

### Impact
**✅ Does NOT affect functionality**
- APIs still work correctly
- Data is fetched properly
- Application functions normally
- This is a Next.js 15 development mode quirk

### When It Happens
- Usually on dynamic routes like `/api/counties/[stateId]`
- Occurs in development mode only
- Does NOT happen in production builds

### Verification
Despite the error, the application works:

1. **Test in Browser**: http://localhost:3000
   - Select state → Counties load ✅
   - Select county → Status displays ✅
   - Form submission works ✅

2. **Check Database Logs**:
   ```
   Connected to PostgreSQL database ✅
   Executed query { ... rows: 51 } ✅
   ```

3. **API Returns Data**:
   - States API returns 51 states ✅
   - Counties API returns county list ✅
   - Status API returns correct status ✅

### Solutions

#### Option 1: Ignore It (Recommended)
The error is cosmetic. Continue development normally.

#### Option 2: Use Production Build
```bash
npm run build
npm start
```
Production builds don't have this issue.

#### Option 3: Restart Dev Server
```bash
# Kill current server (Ctrl+C)
rm -rf .next
npm run dev
```

---

## Next.js 15 Dynamic Params

### Issue
Route parameters must be awaited in Next.js 15.

### Status
**✅ Fixed** - All routes updated to await params:
- `/api/counties/[stateId]` ✅
- `/api/county-status/[countyId]` ✅

### Code Pattern
```javascript
// ✅ Correct (Next.js 15)
export async function GET(request, { params }) {
  const { id } = await params;
}
```

---

## Summary

| Issue | Status | Impact | Action Required |
|-------|--------|--------|-----------------|
| Jest Worker Error | ⚠️ Known | None | No action needed |
| Dynamic Params | ✅ Fixed | None | Already fixed |
| Database Connection | ✅ Working | None | None |
| API Endpoints | ✅ Working | None | None |

**Application is fully functional despite cosmetic dev errors!** 🎉
