### Unit Test Results

| Function / Component | Test File | Status | Cases Covered | Notes |
|---|---|---|---|---|
| DigitalSignatureService | digitalSignatureService.test.ts | PASS | signAsResearcher success; fallback on missing columns; signAsChairperson precondition; signAsChairperson success + audit; verifySignatures success; verifySignatures error; getSignatureAuditTrail success/error; canUserSign researcher/chairperson + fallback | Supabase fully mocked; navigator.userAgent stubbed |
| useAuth hook | useAuth.test.ts | PASS | getUser success; getUser failure; auth state change update; unsubscribe on unmount | Supabase auth mocked |
| LoginForm | login-form.test.tsx | PASS | login success (verified email); unverified email signs out; login error; forgot password with 60s cooldown | JSDOM timers mocked; toast stubbed |
| Staff Dashboard (Announcements) | staff-Dashboard.test.tsx | PASS | audience filtering; create announcement and refresh list | Chart mocked; Supabase mocked |
| Staff Review (Submissions/Review) | staff-Review.test.tsx | PASS | Assess preconditions; Reviewer deny path writes history without status update | Pdf viewer mocked; Supabase mocked |
| DeviationReportForm (Researcher) | researcher-Deviation.test.tsx | PASS | validation of required fields; successful submit shows signature step | Uploads and services mocked |

### Coverage Checklist

- DigitalSignatureService
  - [x] Researcher signing success path
  - [x] Researcher fallback update when signature columns missing
  - [x] Chairperson signing blocked when researcher not signed
  - [x] Chairperson signing success and audit insert
  - [x] Verify signatures returns both valid and integrity true
  - [x] Verify signatures error returns invalids and integrity false
  - [x] Audit trail success and error handling
  - [x] Permission checks: researcher owner/not owner; chairperson rules; fallback when columns missing

- useAuth
  - [x] Sets user on successful getUser
  - [x] Handles getUser rejection
  - [x] Updates on onAuthStateChange
  - [x] Unsubscribes on unmount

- LoginForm
  - [x] Successful login with verified email
  - [x] Unverified email triggers signOut and error
  - [x] Handles signInWithPassword error
  - [x] Forgot password triggers reset and enforces cooldown

- Staff Dashboard (Announcements)
  - [x] Filters announcements by role audience
  - [x] Creates announcement and reloads list
  - [ ] Loads stats counts (total/pending/completed)
  - [ ] Builds 12-month chart buckets from proposals
  - [ ] Paginates recent actions (prev/next boundaries)
  - [ ] Handles errors by clearing lists without crashing

- Staff Review (Submissions/Review)
  - [x] Assess: prevents proceeding without risk assessment completion
  - [x] Reviewer deny: inserts history with comments, no status update
  - [ ] Fetches review_type and sets required reviewer count per type
  - [ ] Auto-selects current user when review_type is Exempt
  - [ ] Lists documents per phase; filters hidden/system files
  - [ ] Creates signed URL; handles failure toast and placeholder state
  - [ ] Assign flow: enforces exact reviewer count and writes history with names
  - [ ] Approve flow: non-reviewers move status via stat
  - [ ] Deny flow (non-reviewers): updates status via statm and writes history
  - [ ] Prevents removing assigner and caps reviewer load at < 3

- DeviationReportForm (Researcher)
  - [x] Validates all required fields block submission
  - [x] On success: uploads optional files, submits report, shows signature pad
  - [ ] Handles upload failures and aggregates error messages
  - [ ] Handles case where uploads return no valid URLs but files exist
  - [ ] Handles submission error path and alerts user

### Additional Areas To Cover

- ProfilePage
  - [ ] Requests Notification permission and handles denied/unsupported
  - [ ] Updates email/push notification preferences via auth.updateUser
  - [ ] Change password: re-auth failure shows error
  - [ ] Change password: requirements validation prevents submit
  - [ ] Change password: success updates password and resets fields
  - [ ] Avatar: enforces PNG and size limit
  - [ ] Avatar: crops and uploads; updates public URL
  - [ ] Sign out triggers redirect to /login

### Assumptions and Suggestions

- Assumptions
  - `rpc('verify_document_integrity', { report_id })` returns `{ data: boolean }` without throwing; service already guards errors.
  - Fallback for missing signature columns updates `status: 'Researcher Signed'` and succeeds if update succeeds.
  - Login redirect path `/sdash` does not need to be asserted in unit tests (router navigate mocked implicitly by MemoryRouter).
  - Staff Dashboard stats/chart queries are not asserted; focus is on announcements CRUD filtering.
  - Staff Review navigation side-effects after submit are not asserted; success criteria is DB interaction and guards.
  - Deviation form file uploads may return empty list; success path focuses on service call and signature step rendering.

- Suggestions
  - Export Supabase from `src/DB.tsx` only and use that import path consistently to simplify mocks.
  - Consider extracting a small Supabase table helper to reduce repetitive `from(...).select().eq().single()` chains, easing testing.
  - Expose constants for `signature_status` values to avoid string drift in tests and code.


