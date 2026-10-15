---
name: useblocker-bypass-regression-test
description: Use when writing a Vitest test for a react-router useBlocker unsaved-changes guard in this repo — specifically an intentional-navigation handler (Edit / Submit / Cancel) that uses flushSync(() => setIsNavigating(true)) before navigate() to bypass the blocker. A test that reads the blocker predicate after act() passes even when flushSync is removed, so it does not guard the fix. Trigger on any test touching isNavigating, useBlocker, flushSync, or a *.hooks.js navigation-blocker handler.
---

# useBlocker Bypass Regression Test

## Overview

Several `*.hooks.js` files in this repo (`RequestPreAwardApproval`, `ApprovePreAwardApproval`, `ReviewBudgetTeamRequisition`, award-approval siblings) register a react-router `useBlocker` unsaved-changes guard:

```js
const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
        !isNavigating && hasChanged && currentLocation.pathname !== nextLocation.pathname
);
```

An *intentional* navigation (Edit / Submit / Cancel) must slip past this guard. The pattern is always:

```js
flushSync(() => { setIsNavigating(true); });   // <-- load-bearing
navigate(`/somewhere`);
```

**Core principle:** `flushSync` is the load-bearing line, and the obvious unit test does not guard it. react-router evaluates the blocker predicate **synchronously** at the instant `navigate()` fires on a forward push. A plain `setIsNavigating(true)` batches the state update, so the predicate that runs during `navigate()` is still closed over `isNavigating === false` and blocks — reintroducing the bug. `flushSync` forces the commit (and blocker re-registration) *before* `navigate()`. A test must therefore assert the predicate's value **at navigate-time**, not after `act()` settles.

## The trap (why the obvious test is false confidence)

The natural test reads the captured predicate *after* the handler runs:

```js
act(() => { result.current.handleEdit(); });
expect(capturedCb(nav)).toBe(false);   // ❌ passes with OR without flushSync
```

This passes even against a mutant where `flushSync(...)` is replaced by a plain `setIsNavigating(true)`. Two reasons, both verified by mutation testing in this repo:

1. **`useBlocker` is mocked.** The mock just captures the predicate; react-router's real synchronous re-check during a forward push — the exact thing `flushSync` protects — never runs.
2. **`act()` masks the timing.** `act()` flushes all pending state before returning, so by the time you call `capturedCb(nav)` the batched `setIsNavigating(true)` has already committed. The stale-vs-fresh distinction is gone.

Result: dropping `flushSync` reintroduces the production bug with a fully green suite. The regression test for the bug does not protect the line the fix is made of.

## The technique: evaluate the predicate at navigate-time

Reproduce react-router's synchronous behavior by evaluating the currently-registered predicate **inside the `navigate` mock** — the moment `navigate()` is called:

```js
it("does not block at the instant navigate() fires (guards flushSync)", async () => {
    let capturedCb;
    // mockImplementation re-captures the predicate on EVERY render, so capturedCb
    // always points at the latest closure over isNavigating.
    mockUseBlocker.mockImplementation((cb) => {
        capturedCb = cb;
        return { state: "unblocked", proceed: mockProceed, reset: mockReset };
    });
    const { result } = setup(buildAgreement());
    await waitFor(() => expect(result.current).toBeDefined());

    // Dirty the form so the guard WOULD fire on navigation.
    act(() => { result.current.setNotes("some note"); });

    const nav = {
        currentLocation: { pathname: "/agreements/1/pre-award-approval" },
        nextLocation: { pathname: "/agreements/review/1/edit" }
    };
    await waitFor(() => expect(capturedCb(nav)).toBe(true)); // sanity: blocks before edit

    // Capture the predicate's value at the exact moment navigate() runs — this is
    // what react-router does synchronously on a real forward push.
    let blockedAtNavigateTime;
    navigateMock.mockImplementation(() => {
        blockedAtNavigateTime = capturedCb(nav);
    });

    act(() => { result.current.handleEdit(); });

    // With flushSync -> false (bypass committed before navigate). Without -> true (bug).
    expect(blockedAtNavigateTime).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith(
        "/agreements/review/1/edit?returnTo=%2Fagreements%2F1%2Fpre-award-approval"
    );
});
```

Requires a **module-level stable `navigateMock`** (not `useNavigate: () => vi.fn()`, which returns a throwaway) so `mockImplementation` and URL assertions work. `beforeEach` must `vi.clearAllMocks()`.

## Verify it actually guards (mutation test)

A bypass test that you have not mutation-tested is presumed to be the trap above. Confirm it fails against the mutant:

1. In the handler, replace `flushSync(() => { setIsNavigating(true); });` with a plain `setIsNavigating(true);`.
2. Run the test — it MUST fail (`expected true to be false` at `blockedAtNavigateTime`).
3. Run the existing hook suite — it will still pass (that is the coverage gap this test closes).
4. Restore the handler (`git checkout` the file).

If the test still passes against the mutant, it is the after-`act()` trap — rewrite it to evaluate inside the `navigate` mock.

## Quick Reference

| Assertion site | Catches `flushSync` removal? |
|---|---|
| `capturedCb(nav)` after `act()` | ❌ No — `act()` already flushed the batched setState |
| `capturedCb(nav)` inside `navigateMock.mockImplementation` | ✅ Yes — reads the predicate at navigate-time |
| `navigate` called with encoded URL | ❌ No (guards the URL, not the timing) |
| bypass-flag exists at all (remove `setIsNavigating` → fail) | Partial — guards the flag, not `flushSync` |

## Scope and honest limits

- This is the strongest guard achievable at the **hook-unit** layer, where `useBlocker`/`navigate` are mocked. It models — does not exercise — a real react-router transition.
- A fully faithful guarantee needs an integration test with a real `MemoryRouter`/`createMemoryRouter`, a real blocker, and real routes. **There is no such test in this repo** — every blocker test mocks `useBlocker` (see `frontend/src/hooks/useNavigationBlocker.test.js`, `frontend/src/hooks/useUnsavedChangesBlocker.test.js`). Don't introduce that machinery for one line unless asked; the navigate-time unit test is the idiomatic choice here.
- If you keep only the after-`act()` assertion (e.g. matching a sibling test's style), add a one-line comment stating it guards the bypass-flag contract and URL but **not** the `flushSync` timing — so the next reader isn't misled. Don't write a comment claiming it verifies `flushSync` when it doesn't.

## Common Mistakes

- **Asserting `capturedCb(nav) === false` after `act()` and calling it done.** That is the trap — mutation-test it and watch it pass against the mutant.
- **Using `useNavigate: () => vi.fn()`.** Returns a fresh mock each call; you can't attach `mockImplementation` or assert the URL. Hoist a module-level `navigateMock`.
- **Comment claims flushSync is verified when it isn't.** A comment saying "flips the bypass (flushSync)" on an after-`act()` test overstates coverage. State what the test actually guards.
- **Reaching for a full real-router harness by default.** Non-idiomatic here and heavy for one line. Only do it if explicitly asked.

## Real-World Impact

On issue 6061 (Edit button wrongly showing the cancel modal), the fix added `handleEdit` with `flushSync(() => setIsNavigating(true))`. Adversarial review mutation-tested the new hook test: replacing `flushSync` with a plain `setIsNavigating(true)` left all 14 hook tests green — the regression test for the bug did not protect the fix's load-bearing line. The navigate-time technique above fails against that mutant, closing the gap. See [dead-code-after-removal-sweep](../dead-code-after-removal-sweep/SKILL.md) for the sibling "verify with a mutation" discipline applied to deletions.
