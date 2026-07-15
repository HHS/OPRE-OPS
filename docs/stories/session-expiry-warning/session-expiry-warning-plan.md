# Plan: Proactive Session-Expiry Warning Modal

> Team context doc. No ticket number exists yet for this work (searched GitHub issues, found none). Create one before implementation and rename this directory/file to match (e.g. `docs/stories/OPS-XXXX/session-expiry-warning-plan.md`).

## Problem Statement

Today, session expiry is handled **reactively only**: nothing on the client notices that a session is about to expire. A user can be idle on a page with no API calls in flight, and the *only* thing that happens is that their **next** click fails with a 401, at which point they're bounced to `/login` with no warning and (depending on what they were doing) with unsaved work.

**Goal:** ~60 seconds before the user's session is about to be force-expired for inactivity, show a modal that:
- Warns them their session is about to expire
- Shows a live countdown
- Offers "Continue Session" (extends it) and (recommended addition) "Log Out" (ends it immediately, cleanly)

### Acceptance Criteria

- [ ] A logged-in user idle for the full idle-timeout window minus ~60s sees a modal warning them their session is about to expire, with a live countdown.
- [ ] Clicking "Continue Session" extends the real server-side session (not just client-side state) and dismisses the modal.
- [ ] Clicking "Log Out" ends the session immediately and returns the user to `/login`.
- [ ] If no action is taken and the countdown reaches zero, the user is logged out and redirected to `/login` with a message explaining why — *unless* they have unsaved work in progress, in which case they see an explicit "session expired, unsaved changes" state instead of a silent redirect (see Architecture item 3).
- [ ] A user who is actively working (making real API calls) never sees the warning, no matter how long they've been in the app, up to the refresh-token ceiling.
- [ ] Background `/notifications/` polling alone never counts as activity and never suppresses or delays the warning.
- [ ] The modal is fully keyboard-navigable and its countdown is announced to screen readers without spamming an announcement every second.
- [ ] Logged-out/anonymous pages (e.g. the homepage) never mount this feature's timers or modal.

### Rollout & Monitoring

- No feature flag is proposed for v1 — this is a strict UX improvement on an existing, unconditionally-enforced server-side control (the idle logout already happens today; this only adds a warning). A broken warning modal in the worst case degrades to today's existing reactive-only behavior, not a new failure mode, so the blast radius of a bug is bounded. That said, confirm with the team whether staged rollout (e.g. behind an existing internal feature-flag mechanism, if one exists) is still wanted out of caution — flagged as an open question below rather than assumed.
- **Minimum monitoring for v1:** log (via the existing `loguru`/event-logging patterns already used in `ops_api`) when the heartbeat endpoint is hit and when idle-logout fires, if not already sufficiently covered by the existing `IDLE_LOGOUT` event type — this lets the team distinguish "feature is working as intended" from "users are getting surprise-logged-out" after ship. No new frontend analytics pipeline is proposed to be built for this alone; if the team already has frontend usage analytics, add modal-shown/continue-clicked/expired-without-action counters there — otherwise, treat as out of scope for v1 and rely on backend event logs plus user-reported feedback.

## Current State — How Session/Token Expiry Actually Works Today

This section is the foundation the rest of the plan depends on. **Read it before implementing** — the naive approach ("decode the JWT's `exp` claim and set a timer for `exp - 60s`") is wrong for a specific, non-obvious reason explained below.

### The three clocks in play

| Clock | Config | Location | Behavior |
|---|---|---|---|
| Access token lifetime | `JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)` | `backend/ops_api/ops/environment/default_settings.py:24` | Fixed at mint time. Silently, transparently refreshed by the frontend's 401 interceptor — the user never sees this expire. |
| Refresh token lifetime | `JWT_REFRESH_TOKEN_EXPIRES = timedelta(hours=12)` | same file, line 25 | Long-lived ceiling. Out of scope for this feature (see Non-Goals). |
| **Idle session window** | `USER_SESSION_EXPIRATION = timedelta(minutes=28)` | same file, line 70 | **This is the clock that actually logs users out.** No silent recovery once tripped. |

### Why the idle-session window (28 min), not the access-token expiry (30 min), is the one to warn about

This is the crux of the whole design, so it's worth spelling out in full:

1. Every authorized request runs through `check_user_session_function` (`backend/ops_api/ops/auth/decorators.py:126-159`), invoked from a Flask `before_request` hook in `backend/ops_api/ops/__init__.py:265-286`. On each request it calls `check_last_active_at`, which raises `InvalidUserSessionError` (→ HTTP 401, `backend/ops_api/ops/error_handlers.py:171-180`) if `now - last_active_at > USER_SESSION_EXPIRATION` (28 min).
2. Critically, `check_user_session_function` only bumps `last_active_at` **if the endpoint name does not contain `"notification"`** (`decorators.py:151-155`): `if "notification" not in request.endpoint: latest_user_session.last_active_at = datetime.now(); ...`. The frontend polls `/notifications/` every 60 seconds via `useNotifications.js:10-17` (`pollingInterval: 60000`) for as long as any component using that hook is mounted — and this polling **does not extend the session**. This exact behavior (constant background polling that looks like activity but isn't) is the documented reason `USER_SESSION_EXPIRATION` was deliberately set 2 minutes *below* `JWT_ACCESS_TOKEN_EXPIRES` — see `docs/adr/029-session-access-token-timing.md`, which exists specifically to avoid a race where the access token goes cryptographically invalid before the app's own idle-checking logic can run and log the event properly.
3. Once idle-logout fires (`idle_logout()`, called from `check_last_active_at`'s caller), it deactivates **all** the user's sessions server-side. The next request — including a would-be refresh — fails: `auth_service.refresh()` (`backend/ops_api/ops/auth/service.py:81-90`) checks `latest_user_session.is_active` first and raises `InvalidUserSessionError` if it's been deactivated. **There is no silent recovery path from idle-logout.** The user must re-authenticate.
4. By contrast, the *access token's* 30-minute expiry is invisible to the user: `getBaseQueryWithReauth` (`frontend/src/api/opsAPI.js:19-35`) catches the resulting 401, calls `postRefresh()`, and — as long as the idle session is still valid — `auth_service.refresh()` mints a fresh access token and (in that code path only) also bumps `last_active_at` (`service.py:104-106`). This happens continuously and invisibly for as long as the user keeps making real API calls; a user can stay logged in indefinitely this way (until the 12h refresh-token ceiling), never seeing the access-token clock at all.
5. Concurrency is already handled: `get_latest_user_session` (`backend/ops_api/ops/auth/utils.py:165-191`) does `SELECT ... FOR UPDATE` with a 5s `lock_timeout` before reading/mutating a session row, which serializes concurrent `last_active_at` bumps and idle-logout checks for the same user regardless of which endpoint triggers them. This means the new heartbeat endpoint proposed below introduces **no new race condition** — it goes through the exact same locked read/write path every other authorized endpoint already uses.

**Conclusion:** a timer built from the JWT's raw `exp` claim would be **actively misleading**. It would count down from a fixed 30-minute mint-time mark, but the real, non-recoverable cutoff happens 2 minutes earlier, at 28 minutes of *true* inactivity (no non-notification API calls) — and that 28-minute clock resets on every real API call, not on a fixed schedule. A JWT-`exp`-based timer showing "1:00 remaining" could be shown to a user who has *already* been logged out.

**The warning must therefore be driven by client-tracked idle time (mirroring the server's `last_active_at` semantics), not by decoding the token.**

## Proposed Design

### Key Decision 1 — What counts as "activity" that resets the clock

**Decision: only successful (fulfilled) API responses from real, non-notification endpoints reset the clock — not raw DOM events (mousemove/keydown/click).**

- Option A — Raw DOM activity (mousemove, keydown, scroll), the common pattern for consumer-app idle-timers (e.g. `react-idle-timer`).
  - Con: **This would desync from the server.** A user could wiggle their mouse for 28 minutes without firing a single non-notification API call; the client's timer would keep resetting while the server's `last_active_at` does not, and the user gets logged out anyway, with the client having shown no warning (or worse, showing "you're safe" right before a hard 401).
- Option B (chosen) — Track the timestamp of the last fulfilled, non-notification API response. This is the same signal the server uses.
  - Con: mildly more plumbing than a DOM listener, but it's the only option that can't drift from server truth.
  - **Implementation note (revised after review):** don't build a separate RTK middleware or a new fulfilled-action matcher for this. `getBaseQueryWithReauth` (`frontend/src/api/opsAPI.js:19-37`) already wraps *every* request `opsApi` makes and already receives `api.endpoint` as an argument — it's the single existing choke point. Stamp `lastActivityAt` there directly (in a module-level ref or a tiny dedicated store, not necessarily a full Redux slice) whenever `api.endpoint` isn't one of the notification endpoints, right where the wrapper already inspects the result. This avoids introducing a whole new middleware + action-matching layer to duplicate logic the base query wrapper already has the exact information to do inline.

### Key Decision 2 — How "Continue Session" actually extends the session

Clicking "Continue Session" must cause the **server's** `last_active_at` to bump — not just reset a client-side timer, or the warning will silently reappear on schedule regardless of the click (or worse, the client will think it extended the session while the server logs the user out anyway).

- Calling `POST /auth/refresh/` does **not** reliably do this: `auth_service.refresh()` (`service.py:81-90`) only touches `last_active_at` in the branch where it actually mints a new token (i.e. only if the *current* access token happens to already be expired). If the access token is still valid — the common case, since it lasts 30 min and the warning fires at ~27 min of elapsed idle time — `refresh()` returns early and touches nothing.
- Also, `/auth/refresh/` is explicitly excluded from the `before_request` session check in `backend/ops_api/ops/__init__.py:270-276` (along with `login_post`, `logout_post`, `home.show`, `health-check`), so hitting it doesn't run `check_user_session_function` at all.
- On top of both of those: `refresh_post` is decorated `@jwt_required(refresh=True, verify_type=True)` (`backend/ops_api/ops/auth/api.py:42-43`) — it requires the long-lived *refresh* token, not the normal access-token `Authorization` header every other authenticated call uses. Wiring "Continue Session" through this endpoint would mean sending a different token than the rest of the app's request plumbing expects, on top of the two issues above. All three reasons rule it out.
- **Recommendation: add a small, dedicated, authorized "heartbeat" endpoint** (e.g. `GET /api/v1/auth/session/`) whose only job is to be a normal, `jwt_required`-protected endpoint that flows through the standard `before_request` → `check_user_session_function` path (so it must **not** be added to the exclusion list, and its Flask endpoint name must not contain `"notification"`). Hitting it is what actually bumps `last_active_at` and resets the real 28-minute clock. It can return `{"expires_in_seconds": <int>}` — see Key Decision 3.
  - Alternative considered: reuse an existing cheap authorized `GET` (e.g. `GET /users/<id>` for the current user) instead of adding a new route. Rejected as the primary recommendation because (a) it couples this feature's behavior to an unrelated resource's route staying cheap and authorized forever, and (b) a dedicated endpoint is the natural place to also report the session-expiration config (next decision), avoiding a second, unrelated request just to fetch that number.

### Key Decision 3 — Avoid hardcoding the 28-minute window on the frontend

`USER_SESSION_EXPIRATION` is a backend config value tied to compliance controls (AC-12) that has changed before (ADR 29 changed it relative to `JWT_ACCESS_TOKEN_EXPIRES`) and could change again. If the frontend hardcodes `28 * 60 * 1000`, a future backend config change silently desyncs the warning timing from the real cutoff — the modal could fire too early or (worse) too late, in the "too late" case defeating the entire point of this feature.

**Recommendation:** have the new heartbeat endpoint (and/or the login response) return the current `USER_SESSION_EXPIRATION` value in seconds, and have the frontend read the duration from there rather than hardcoding it. Cache it in Redux for the session's lifetime; refetch on login.

## Architecture

### Backend changes

1. **New endpoint:** `GET /api/v1/auth/session/` (name TBD — must not contain "notification").
   - Decorated with `@jwt_required()` (mirrors `logout_post`, not `is_authorized`, since this isn't gated by a resource permission — any authenticated user should be able to heartbeat their own session).
   - Must **not** be added to the `before_request` exclusion list in `backend/ops_api/ops/__init__.py:270-276` — its whole purpose is to run through `check_user_session_function` and bump `last_active_at`.
   - Returns `{"expires_in_seconds": <int>, "last_active_at": "<iso8601>"}`, reading `USER_SESSION_EXPIRATION` from `current_app.config`.
   - Register route + schema in `backend/ops_api/ops/auth/api.py` and `backend/ops_api/ops/auth/schema.py`, following the existing pattern of `login_post`/`logout_post`/`refresh_post`.
   - No new model/migration needed — this only reads existing `UserSession.last_active_at`, which is already touched by `check_user_session_function`.

2. **No changes to `check_user_session_function`, `USER_SESSION_EXPIRATION`, or the idle-logout mechanism itself.** This feature is additive UX on top of existing, working expiry enforcement — it does not change when or how the server actually logs anyone out.

### Frontend changes

1. **Activity tracking** — stamp `lastActivityAt = Date.now()` directly inside `getBaseQueryWithReauth` (`frontend/src/api/opsAPI.js:19-37`) whenever a request succeeds and `api.endpoint` is not one of the notification endpoints (`getNotificationsByUserId`, `getNotificationsByUserIdAndAgreementId`). **Do not build a separate RTK middleware for this** — `getBaseQueryWithReauth` already wraps every `opsApi` request and already has `api.endpoint` in scope; adding a whole new middleware + action-type-matching layer would duplicate logic this wrapper can do inline. Store the timestamp in a small dedicated slice (e.g. `sessionSlice` with just `lastActivityAt`/`expiryDurationSeconds`) so the warning hook can read it reactively via `useSelector` — a bare module-level variable wouldn't trigger a re-render when the hook needs to react to it.
   - The heartbeat endpoint's own request must also count as activity (it will, naturally, once it flows through this same wrapper).
   - Note: this doesn't introduce a new way to keep a session alive indefinitely. Today, *any* authenticated non-notification request already bumps `last_active_at` — a background script polling any existing authenticated `GET` already has the same effect. The heartbeat endpoint is a purpose-built, cheap URL for something already possible, not a new capability or a weakening of the idle-timeout control.

2. **New hook: `useSessionExpiryWarning()`** (e.g. `frontend/src/hooks/useSessionExpiryWarning.js`), mounted once near the app root (inside `DefaultLayout` or `App.jsx`), responsible for:
   - Reading `lastActivityAt` and the session-expiration duration (fetched once via the new heartbeat endpoint on login, or on mount if not yet cached).
   - Running a `setInterval` (every 1s, for a smooth countdown) that computes `remaining = expiryDurationMs - (Date.now() - lastActivityAt)`.
   - When `remaining <= WARNING_THRESHOLD_MS` (60s, but make it a named constant, not a magic number, so tests can override it — see Testing Strategy), sets `showWarningModal = true`.
   - When `remaining <= 0`, and no blocking unsaved-work condition applies (see item 3 below), proactively `dispatch(logout())` and redirect to `/login` (see item 5 below) — don't wait for the next API call's reactive 401, since the user may not make one (they're staring at a modal).
   - **Re-syncs on tab visibility change** (`document.addEventListener("visibilitychange", ...)`): recompute `remaining` immediately when the tab regains focus. Backgrounded tabs can have `setInterval` throttled or fully paused by the browser, so a user who backgrounds the tab for 10 minutes and returns should see an immediately-correct state (either already-expired or correctly-recomputed remaining time), not a stale countdown that was paused mid-flight.
   - Follow the existing ref-pattern used in `useNavigationBlocker.hooks.js` (`saveChangesRef`, `onExitRef`) for any callbacks passed in, to avoid stale-closure bugs inside the interval callback. **Explicitly**: the `setInterval` handle itself must be cleared in the effect's cleanup function (`return () => clearInterval(handle)`), and `lastActivityAt` must be read through a ref inside the interval tick (not captured by value at mount), or the interval will act on stale data. Under React 19 `StrictMode` (active per `frontend/src/index.jsx:442`), effects double-invoke in development — if cleanup is missed, two intervals stack silently. Cover this with an explicit unit test (see Testing Strategy) rather than relying on manual review to catch it.
   - **Gating (this is load-bearing, not optional):** the hook itself must no-op immediately if `state.auth.isLoggedIn` is false — verified that `App`/`DefaultLayout` are **not** exclusively behind `ProtectedRoute`: `Home.jsx` (route `/`, plus its children `/release-notes`, `/next`) renders `<App>` for anonymous visitors too. If the gate is forgotten, the countdown/modal machinery would mount and run for logged-out users on the homepage.

3. **What "unsaved work" protection looks like — required, not optional (added after review).** The original draft of this plan let `remaining <= 0` unconditionally log the user out, with no consideration for in-progress form state (e.g. a half-filled Agreement edit or budget-line wizard). That's a real data-loss path and is not acceptable to ship as-is. Two complementary mitigations, both in scope for v1:
   - **Extend the warning threshold's effective urgency, don't just show a countdown.** The modal's copy and visual treatment should make the stakes concrete (e.g. "Any unsaved changes on this page will be lost" when applicable), not just "your session is expiring."
   - **Check for unsaved-changes state before the hard auto-logout fires, where that signal already exists.** Several existing edit flows already track a `hasUnsavedChanges`/`hasChanged` boolean for their own navigation-blocker modals (e.g. `useNavigationBlocker.hooks.js`, and the `hasChanged`/`hasUnsavedChanges` flags visible in pages like `ApproveAwardApproval.hooks.js`, `EditAgreementAndBudgetLines.jsx`). There is no single global "is anything dirty right now" flag today — building one is in scope for this feature, not a pre-existing piece to just wire up. Minimum viable approach: a small shared `dirtyFormSlice` (or similar) that any form-editing hook can register/unregister a "hasUnsavedChanges" flag into on mount/unmount; `useSessionExpiryWarning` reads it. If it's true when `remaining` hits 0, do **not** silently log out — instead keep the modal open past zero with an explicit "Your session has expired, but you have unsaved changes" state that still forces a decision (e.g. only "Log Out Now" is available, since the server session is genuinely already dead and there is no way to actually save past that point) rather than a silent forced navigation away from unsaved data. This does not prevent the data loss (the server-side session is gone; there is no code path that can persist unsaved data), but it prevents the more damaging failure mode of a *silent, unexplained* redirect away from work the user thought was still safe.
   - This is now a required v1 item, not a "nice to have" — flagged as blocking in review. If descoped, this must be an explicit, named product decision, not a plan omission.

4. **New modal component: `SessionExpiryModal`** (e.g. `frontend/src/components/UI/Modals/SessionExpiryModal.jsx`), rendered from the hook above.
   - **Decision (resolved after review, not deferred to implementation):** build `SessionExpiryModal` as a thin wrapper around `ConfirmationModal`, passing a template-string countdown into its existing `description` prop (`description={`You will be logged out in ${formatCountdown(remaining)}`}`). Verified this is workable: `ConfirmationModal`'s focus-trap `useEffect` (`ConfirmationModal.jsx:58-72`) is keyed on `getFocusableElements`/`handleKeyDown`, not on `description`, so a `description` value changing every second does **not** retrigger the focus trap or steal focus every tick. No fork of the focus-trap logic is needed.
   - Content: heading ("Your session is about to expire"), the countdown via `description` as above, primary button "Continue Session" (`actionButtonText`, calls the heartbeat mutation, which — once fulfilled — updates `lastActivityAt` via the same base-query wrapper and resets the clock; hides the modal), secondary button "Log Out" (`secondaryButtonText`, proactively `dispatch(logout())`, redirect to `/login` immediately, no need to wait for the countdown).
   - Add an `aria-live="polite"` region wrapping the countdown text specifically (not just relying on `ConfirmationModal`'s existing static `aria-describedby`, which has no live-region behavior today). Without this, screen-reader users get either silence or a rapid-fire re-announcement every second as the description text changes — neither is acceptable. This is a real gap in the original draft, not covered by "reuse existing modal a11y scaffolding," since none of the existing modals have a live-updating region to model after.
   - Explicitly **not** dismissible via a no-op path that leaves the user thinking they're safe: Escape/backdrop-click closing the modal (matching `ConfirmationModal`'s existing behavior) is fine — it should behave the same as ignoring it, i.e. the countdown keeps running in the background and will re-show it (or log them out) rather than the dismissal being interpreted as an implicit "continue".
   - **Modal-stacking rule (added after review):** this codebase has no shared modal manager — each modal (`ConfirmationModal`, `SaveChangesAndExitModal`, etc.) owns its own local `showModal` state and independently runs its own focus trap, so two modals could theoretically render simultaneously with competing focus traps. Rule: if another blocking modal (e.g. `SaveChangesAndExitModal`) is already open when `showWarningModal` would flip true, **do not suppress the session-expiry modal** — suppressing it reintroduces the data-loss risk from item 3. Instead, this is the same "unsaved work" case: treat the presence of another open modal as itself a signal there's likely unsaved state in flight, and route through the same dirty-check path as item 3 rather than trying to render both modals at once.

5. **Idle-logout messaging on the login page.** When the hook proactively logs the user out at `remaining <= 0` (or when the user clicks "Log Out" from the modal), redirect with enough context for `Login.jsx` to show a distinct message — e.g. `navigate("/login", { state: { reason: "idle_timeout" } })` — reusing the existing `SimpleAlert` + `loginError` pattern in `frontend/src/pages/Login.jsx` (currently used for sign-in failures) with a new message variant ("You were logged out due to inactivity") rather than a bare, unexplained redirect to the login screen.
   - **Duplicate-logout race (added after review):** `getBaseQueryWithReauth` (`opsAPI.js:19-37`) already independently dispatches `logout()` + a hard `window.location.href = "/login"` when a *reactive* 401/refresh-failure occurs (e.g. from some other in-flight request hitting the same expired session around the same time). The proactive path in this hook and that existing reactive path could both fire within the same window. Mitigation: before the hook's proactive logout runs, check `state.auth.isLoggedIn` — if it's already `false` (the reactive path got there first), no-op instead of double-dispatching `logout()`/double-navigating.

## Edge Cases & Risks

| Case | Behavior / Mitigation |
|---|---|
| Multiple tabs open | Each tab tracks its own `lastActivityAt` independently (separate JS runtimes). Tab A could show the warning even though Tab B just made a real request seconds ago and reset the *server's* clock. **Recommend documenting as a known v1 limitation, not solving it now** — a cross-tab fix (e.g. `BroadcastChannel` or a `storage` event listener on a shared `localStorage` key) is a reasonable v2 follow-up. Flagging this explicitly so it isn't mistaken for a bug later. |
| Backgrounded tab throttling | Browsers throttle/pause `setInterval` in background tabs. Mitigated by the visibility-change resync in the hook (item 2 above) — recompute from `lastActivityAt` on `visibilitychange`, don't trust elapsed interval ticks alone. |
| Client/server clock skew | The server is authoritative regardless (it enforces the real cutoff independent of anything the client computes) — worst case here is the warning fires a few seconds early/late, a cosmetic issue, not a security/correctness one. |
| Modal shown pre-login or on `/login` | Hook must be gated on `state.auth.isLoggedIn`; don't mount it inside `Login.jsx`'s tree. |
| "Continue Session" click races with expiry | If the countdown hits 0 in the same tick the user clicks "Continue," the heartbeat request will simply fail with the same 401/`InvalidUserSessionError` the reactive path already handles — falls through to the existing `getBaseQueryWithReauth` failure path (dispatch `logout()`, redirect). No special-casing needed. |
| Access-token expiry firing *during* the warning window | Already handled invisibly by the existing 401 interceptor (`opsAPI.js:19-35`) regardless of whether the warning modal is showing — no interaction effects expected, but worth an explicit test case (see below). |

## Non-Goals / Out of Scope (v1)

- Warning about refresh-token (12h) expiry — out of scope; most single sessions won't approach this, and it's a materially different, much-longer-lived boundary.
- Cross-tab synchronization of activity/warning state — documented as a known limitation, not solved (see Edge Cases).
- Changing `USER_SESSION_EXPIRATION`, `JWT_ACCESS_TOKEN_EXPIRES`, or any existing expiry/idle-logout enforcement logic — this feature only adds a warning on top of current behavior.

## Testing Strategy

**Durations must be configurable/injectable for tests** — 28 minutes and a 60-second warning threshold are unworkable in both unit and e2e tests as hardcoded constants:
- Unit tests: use `vi.useFakeTimers()` (standard in this codebase) to fast-forward the hook's `setInterval` logic without waiting in real time; inject a short `expiryDurationMs`/`warningThresholdMs` via hook params or a mocked heartbeat response rather than the real 28-minute default.
  - **Caveat (added after review): fake timers alone cannot validate the visibility-change resync path.** `vi.useFakeTimers()` advances `setInterval` deterministically, tick by tick — it will never reproduce the actual failure mode the resync logic exists to handle, which is the browser *skipping* ticks entirely while a tab is backgrounded. A test that only calls `vi.advanceTimersByTime(...)` would pass even if the resync `visibilitychange` handler were deleted entirely, because fake timers never "miss" a tick the way a real backgrounded tab does. The resync test must instead: (1) set `lastActivityAt` in the past via `vi.setSystemTime()`, (2) stub `document.visibilityState` and dispatch a `visibilitychange` event *without* first advancing any interval ticks, and (3) assert the hook recomputes `remaining` correctly from the jumped clock alone. This exercises the resync path independently of the interval, which is the actual point of having it.
- Cypress e2e: needs a way to force a very short session-expiration window for a single test run. **Confirmed via review that no test-specific backend settings override currently exists** (`backend/ops_api/ops/environment/dev.py`, `local/localhost.py`, and `local/container.py` only import the shared defaults; there is no precedent to reuse) — this is new config machinery, not a mechanism already available to fall back on. Two concrete options, pick one during implementation rather than leaving it open:
  1. Add a test-only environment config (e.g. `environment/test.py` or an env-var override) that sets `USER_SESSION_EXPIRATION` to a few seconds, used only by the Cypress test-runner's backend instance.
  2. Keep the real backend timing untouched, and instead have the Cypress spec intercept the heartbeat endpoint's response and mock `expires_in_seconds` down to a small number — this tests the frontend countdown/modal behavior end-to-end but does **not** exercise real backend idle-logout timing.
  - **Do not attempt to wait out a real 28-minute window in CI**, and do not write an e2e assertion that depends on real backend timing (e.g. "session survives 28+ minutes of real activity") unless option 1 is built — that specific assertion is out of reach with client-side mocking alone (see below).

### Unit tests
- [ ] Activity tracking: a fulfilled response from a non-notification endpoint (via `getBaseQueryWithReauth`) updates `lastActivityAt`; a fulfilled response from a notifications endpoint does not.
- [ ] `useSessionExpiryWarning`: modal shows when remaining time crosses the warning threshold; hides after a successful heartbeat; proactively logs out at `remaining <= 0` when no unsaved-work flag is set.
- [ ] `useSessionExpiryWarning` + unsaved-work flag set: at `remaining <= 0`, does **not** silently log out; instead surfaces the "session expired, unsaved changes" state described above.
- [ ] Interval cleanup: mount and unmount the hook, assert `clearInterval` was called (e.g. spy on `window.clearInterval`) — regression test for the double-invoke/leak risk under `StrictMode`.
- [ ] Visibility-change resync (see caveat above — must not rely on interval ticks to prove this): jump the system clock via `vi.setSystemTime()` past expiry with no prior tick advancement, dispatch `visibilitychange`, assert immediate correct reaction.
- [ ] `SessionExpiryModal`: "Continue Session" calls the heartbeat mutation; "Log Out" dispatches `logout()` and redirects; countdown text updates without retriggering the focus trap (assert focus doesn't move on a `description` update).
- [ ] Duplicate-logout guard: simulate `state.auth.isLoggedIn` already `false` when the hook's proactive-logout path would fire; assert `logout()` is not dispatched a second time.
- [ ] `Login.jsx`: renders the idle-timeout message when navigated to with `{ state: { reason: "idle_timeout" } }`.

### Backend tests
- [ ] New heartbeat endpoint: returns 200 + `expires_in_seconds` for an authenticated user with a valid session; returns 401 for an expired/deactivated session; confirm it actually bumps `last_active_at` (i.e. `check_user_session_function` ran) — write an integration test that idles a session close to the boundary, hits the endpoint, and confirms the session survives past the original boundary.
- [ ] Confirm the new endpoint is *not* present in the `before_request` exclusion list (regression test against `backend/ops_api/ops/__init__.py`'s `all_valid_endpoints` construction, if feasible, or at minimum an integration test proving the endpoint updates `last_active_at`).

### Manual / E2E
- [ ] With a shortened test session window: idle past the warning threshold → modal appears with correct countdown → click "Continue Session" → modal disappears, session survives past the original would-be cutoff.
- [ ] Same setup, let the countdown hit 0 with no interaction and no unsaved-work flag set → proactively redirected to `/login` with an idle-timeout message.
- [ ] Same setup, with an unsaved-work flag set (e.g. mid-edit on an Agreement form) → countdown hits 0 → confirm the "session expired, unsaved changes" state appears instead of a silent redirect.
- [ ] Confirm the modal does not appear for a user who is actively working (making real, non-notification API calls) during a shortened test window — this specific assertion needs the backend-config approach (option 1 above), not a client-side heartbeat mock, since it must prove *real* server-side idle-logout doesn't fire; **descope this one to backend integration coverage instead of e2e if the backend test-config override isn't built.**
- [ ] Confirm normal background `/notifications/` polling alone does not suppress or delay the warning (i.e. does not falsely look like activity) — same backend-timing caveat as above; can be covered as a backend integration test on `check_user_session_function`'s notification-endpoint exclusion instead of e2e.
- [ ] Accessibility pass: focus trap, keyboard navigation, and specifically the `aria-live` countdown region — this modal introduces the first live-updating region among the modal components, so this cannot simply "match the existing bar" (none of the existing modals have one); needs its own explicit a11y verification, in addition to this repo's standard Cypress `checkA11y` pass.

## File-by-File Change List

**Backend:**
1. `backend/ops_api/ops/auth/api.py` — new `session_get` route.
2. `backend/ops_api/ops/auth/service.py` — new `get_session_status()` (or similar) reading `UserSession`/`USER_SESSION_EXPIRATION`.
3. `backend/ops_api/ops/auth/schema.py` — response schema for the new endpoint.
4. `backend/ops_api/tests/ops/auth/` — new endpoint tests (integration test proving `last_active_at` actually updates).

**Frontend:**
1. `frontend/src/store.js` — register the new slice's reducer. (No new middleware — see Key Decision 1's implementation note.)
2. `frontend/src/api/opsAPI.js` — add the `lastActivityAt` stamp inside the existing `getBaseQueryWithReauth` wrapper; add a new RTK Query endpoint for the heartbeat call (`useGetSessionStatusQuery`/`useExtendSessionMutation`).
3. New slice (e.g. `frontend/src/components/Auth/sessionSlice.js`) — `lastActivityAt`, `expiryDurationSeconds`.
4. New shared "dirty form" tracking slice (e.g. `frontend/src/hooks/useUnsavedChangesRegistry.js` or extend `sessionSlice`) — lets any form-editing hook register/unregister a "has unsaved changes" flag; read by `useSessionExpiryWarning` per item 3 above. **This is new — there is no existing global flag to reuse**, only per-page local `hasChanged`/`hasUnsavedChanges` state.
5. `frontend/src/hooks/useSessionExpiryWarning.js` — new hook (core logic, visibility-change resync, unsaved-work check, duplicate-logout guard).
6. `frontend/src/components/UI/Modals/SessionExpiryModal.jsx` (+ `.test.jsx`, `.stories.jsx` matching sibling modals' convention) — thin wrapper around `ConfirmationModal`, with an `aria-live` countdown region.
7. `frontend/src/components/Layouts/DefaultLayout/DefaultLayout.jsx` or `frontend/src/App.jsx` — mount the hook + modal, gated on `isLoggedIn` (load-bearing — see item 2's gating note; `Home.jsx` renders this tree unauthenticated too).
8. `frontend/src/pages/Login.jsx` — idle-timeout message variant, read from `location.state.reason`.
9. `frontend/src/hooks/useSessionExpiryWarning.test.js`, `frontend/src/components/UI/Modals/SessionExpiryModal.test.jsx` — new tests (see Testing Strategy for the specific cases, including interval-cleanup and duplicate-logout regression tests).
10. `frontend/cypress/e2e/sessionExpiryWarning.cy.js` — new e2e spec (needs the short-window test approach decided in Testing Strategy).

## Open Questions (resolve before/during implementation)

- [ ] Exact warning threshold: is 60 seconds the final number, or should it be configurable per-deployment (e.g. via the same config mechanism as `USER_SESSION_EXPIRATION`)?
- [ ] Should the heartbeat endpoint live under `/auth/` or somewhere else (e.g. `/users/session/`)? Naming/placement should follow whatever the team's current auth-route conventions favor.
- [ ] Should idle-triggered logout be logged as a distinct `OpsEventType` for audit purposes, mirroring the existing `IDLE_LOGOUT` event type (`backend/models/events.py:71`) that's presumably already emitted server-side when `idle_logout()` fires? (Likely: no *new* event needed, since the server already logs this — just confirm the existing event is sufficient and the frontend doesn't need to independently report anything.)
- [ ] Product/design sign-off on exact modal copy, and on whether "Log Out" should be a modal button at all vs. just "Continue Session" + implicit expiry.
- [ ] Confirm with the team whether the multi-tab limitation (documented above) is acceptable for v1 or needs to be in scope from the start.
- [ ] Confirm the shared "dirty form" registry (Architecture item 3 / File-by-File item 4) is genuinely acceptable as new, v1-scoped work, since it touches every existing form-editing hook that wants to participate — or whether a narrower first cut (e.g. only wire it into the highest-risk flows, like Agreement/BLI editing, rather than all of them at once) is preferred to limit initial surface area.
- [ ] Confirm with the team whether staged/flagged rollout is wanted despite this plan's assessment that the blast radius of a bug is bounded (see Rollout & Monitoring) — this is a judgment call the plan is deliberately not making unilaterally.
- [ ] Decide which e2e short-window strategy to build (test-only backend config override vs. client-side heartbeat-response mocking) — see Testing Strategy; the two options cover different assertions and the plan does not pick one for the team.

## References

- `docs/adr/029-session-access-token-timing.md` — why idle-session and access-token expirations are offset by 2 minutes; the root cause this whole feature needs to respect.
- `backend/ops_api/ops/auth/decorators.py:112-173` — `check_user_session`, `check_user_session_function`, `check_last_active_at`.
- `backend/ops_api/ops/__init__.py:244-288` — `before_request` hook wiring session checks into every request, and the endpoint exclusion list.
- `backend/ops_api/ops/auth/service.py:81-109` — `refresh()`, showing why it can't be reused as a heartbeat.
- `backend/ops_api/ops/auth/api.py:39-46` — `refresh_post`'s `@jwt_required(refresh=True, ...)` decorator, the third reason it can't double as "Continue Session."
- `backend/ops_api/ops/auth/utils.py:165-191` — `get_latest_user_session`'s `SELECT ... FOR UPDATE` row lock, showing the heartbeat endpoint introduces no new race condition.
- `frontend/src/api/opsAPI.js:19-37` — existing reactive 401/refresh interceptor; also the recommended single choke point for activity-stamping (see Key Decision 1).
- `frontend/src/components/Auth/auth.js`, `frontend/src/components/Auth/authSlice.js` — token storage and `logout()` reducer.
- `frontend/src/hooks/useNotifications.js:10-17` — the 60s polling that does *not* count as activity server-side.
- `frontend/src/components/UI/Modals/ConfirmationModal.jsx:58-72` — focus-trap effect, confirmed safe to reuse under a changing `description` prop.
- `frontend/src/hooks/useNavigationBlocker.hooks.js` — ref pattern for callbacks in effects/intervals; also the closest existing precedent for "unsaved changes" tracking to build item 3's shared registry from.
- `frontend/src/pages/home/index.jsx` (`Home.jsx`) — confirms `App`/`DefaultLayout` render for anonymous users too, making the `isLoggedIn` gate load-bearing.
- `backend/ops_api/ops/environment/dev.py`, `local/localhost.py`, `local/container.py` — confirms no existing test-specific settings override exists for a shortened e2e session window; this would be new machinery, not reused.

## Review History

This plan was drafted, then independently critiqued by three separate review passes (backend/security correctness, frontend implementation feasibility, and UX/testing/completeness), each of which re-verified the plan's citations against the actual source rather than trusting the draft's claims. All three reviews' findings have been incorporated above. Summary of what changed as a result:

- **Blocking, fixed:** the original draft had no handling for in-progress unsaved form work when the countdown hits zero — added as a required v1 item (Architecture item 3), not deferred.
- **Should-fix, fixed:** simplified activity tracking from a proposed new RTK middleware down to a stamp inside the existing `getBaseQueryWithReauth` wrapper; resolved the `ConfirmationModal`-reuse question definitively (yes, as a thin wrapper) instead of deferring it to implementation; added an explicit `aria-live` requirement for the countdown; added interval-cleanup and duplicate-logout-race handling; added a modal-stacking rule; clarified the e2e short-window strategy has no existing precedent to lean on and named two concrete options instead of one vague one; sharpened the fake-timer test caveat for the visibility-resync path.
- **Confirmed non-issues, documented as such (not left ambiguous):** the heartbeat endpoint introduces no new race condition (row-level locking already exists) and no new way to defeat idle-timeout (any authenticated endpoint already has this property today); exposing `USER_SESSION_EXPIRATION` via API is not a compliance concern.
