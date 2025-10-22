# Recipe Website - Issues Checklist

This checklist provides a quick reference for all identified issues. Check boxes as issues are resolved.

## CRITICAL (Fix Immediately)

- [ ] **Build Failure - Google Fonts**: Cannot build application due to font loading failure
  - File: `app/layout.tsx`
  - Action: Switch to local fonts or fix network access

- [ ] **Empty Logout Endpoint**: Users cannot log out
  - File: `app/api/auth/logout/route.ts`
  - Action: Implement POST endpoint that calls `removeAuthCookie()`

## HIGH PRIORITY (Fix This Week)

- [ ] **Cookie Name Mismatch**: Authentication broken across application
  - Files: `lib/auth.ts`, `middleware.ts`, `app/(site)/**/*.tsx`
  - Three different names: `auth_token`, `auth-token`, `cookbook_token`
  - Action: Standardize to one name

- [ ] **Weak JWT Secret**: Insecure default fallback value
  - File: `lib/auth.ts:5`
  - Action: Require JWT_SECRET env var, no fallback

- [ ] **No Rate Limiting**: Auth endpoints vulnerable to brute force
  - Files: `app/api/auth/login/route.ts`, `app/api/auth/register/route.ts`
  - Action: Add rate limiting middleware

- [ ] **Missing Email Validation**: Server-side validation missing
  - File: `app/api/auth/register/route.ts`
  - Action: Add email format validation

- [ ] **Sensitive Logs**: Prisma logs queries in production
  - File: `lib/prisma.ts:8`
  - Action: Only log errors in production

- [ ] **No CSRF Protection**: State-changing operations unprotected
  - Files: All API routes
  - Action: Implement CSRF token validation

## MEDIUM PRIORITY (Fix This Month)

### ESLint Errors (5)
- [ ] Fix `any` type in AuthForm.tsx:189
- [ ] Fix unescaped apostrophe in AuthForm.tsx:197
- [ ] Fix `any` type in Button.tsx:68
- [ ] Convert require() to imports in seed.ts:1,2

### ESLint Warnings (10)
- [ ] Remove unused variable `passwordHash` in login/route.ts:52
- [ ] Remove/use catch parameter `err` in AuthForm.tsx:87
- [ ] Remove unused imports in Navbar.tsx:9-13
- [ ] Remove unused variable `isAuthenticated` in Navbar.tsx:31
- [ ] Remove/use parameter `size` in Utensils.tsx:1
- [ ] Remove/use catch parameter `error` in auth.ts:37

### TypeScript Issues
- [ ] Enable TypeScript strict mode in tsconfig.json
- [ ] Fix Button component type issues
- [ ] Fix UserDropdown ref type mismatch
- [ ] Fix logout route export

### Code Quality
- [ ] Remove console.log from UserDropdown.tsx:17
- [ ] Add pagination to recipe listing endpoint
- [ ] Optimize recipe data fetching (reduce over-fetching)
- [ ] Implement input validation library (Zod)
- [ ] Extract magic numbers to constants
- [ ] Improve error handling (stop swallowing errors)
- [ ] Add proper error logging

## LOW PRIORITY (Address Over Time)

### Testing
- [ ] Add unit tests (Jest/Vitest)
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Aim for >80% code coverage

### Performance
- [ ] Implement caching strategy (Redis)
- [ ] Add database indexes for performance
- [ ] Optimize images with Next.js Image component
- [ ] Add CDN for static assets

### Documentation
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add code comments where needed
- [ ] Document authentication flow
- [ ] Create developer guide

### Security
- [ ] Add security headers (CSP, HSTS, etc.)
- [ ] Implement proper session management
- [ ] Add account lockout mechanism
- [ ] Add password reset flow
- [ ] Consider 2FA support

### Best Practices
- [ ] Validate required environment variables on startup
- [ ] Add API versioning
- [ ] Implement soft deletes for data recovery
- [ ] Add proper connection pooling
- [ ] Standardize naming conventions

### Accessibility
- [ ] Add missing ARIA labels
- [ ] Verify color contrast ratios (WCAG 2.1 AA)
- [ ] Ensure full keyboard navigation
- [ ] Test with screen readers

### Compliance
- [ ] Add privacy policy (GDPR)
- [ ] Implement data export feature (GDPR)
- [ ] Implement data deletion feature (GDPR)
- [ ] Add cookie consent banner
- [ ] Document data processing activities

## Issue Statistics

- **Total Issues:** 33
- **Critical:** 2
- **High:** 6
- **Medium:** 18
- **Low:** 7

## Progress Tracking

- [ ] Critical issues resolved
- [ ] High priority issues resolved
- [ ] Medium priority issues resolved
- [ ] Low priority issues addressed
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Production deployment ready

## Notes

- Review detailed explanations in `SECURITY_AND_ISSUES_REPORT.md`
- Create individual tickets/issues for tracking
- Prioritize based on business impact and risk
- Test thoroughly after each fix
- Consider security review before production deployment
