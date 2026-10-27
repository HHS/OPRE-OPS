# Manual test guide: context-aware breadcrumbs (issue #3789)

Covers PR #5995 (breadcrumbs). Section J also covers PR #5998 (filters that persist when you come back via a breadcrumb).

## Setup

1. Check out `OPS-3789/session-persistent-filters`. It contains both PRs, so you can test everything in one run. To test breadcrumbs alone, use `OPS-3789/context-aware-breadcrumbs` and skip section J.
2. Start the stack: `podman compose up --build`, then open http://localhost:3000.
3. Log in as a **superuser**. That gives you every tab and button the scenarios use: the Procurement Dashboard, editing any agreement, and the Procurement Tracker. A non-superuser needs to be on the agreement's team to edit it, and needs a Procurement Dashboard role.
4. Have the browser address bar visible: several checks look at `?fy=` and `?tab=` in the URL.

### Test data to pick first

- **Fiscal year:** the current FY is **2027** (FY rolls over on Oct 1), and local test data may have little or nothing in it. Wherever a page shows nothing, switch the FY selector to a year that has data.
- **Agreement:** a **contract** that is developed, isn't in review or locked, and has an active procurement tracker. Grants and undeveloped agreements hide some tabs, and Edit is disabled while an agreement is in review.
- **Portfolio:** one with CANs and budget lines in the FY you'll use. For A7 you also need to be a team leader on at least one portfolio, or **My Portfolios** is empty.
- **Project:** one with CAN funding in the chosen FY (B5, D3) and budget lines in at least two FYs (D4).

### How to read a breadcrumb

- `Home` is always first and always links to `/`.
- The last item is the current page's name and isn't a link.
- Everything in between is a link. In the expected results below, `<Agreement>`, `<CAN>`, `<Portfolio>` and `<Project>` mean the name of the item you opened.
- **"Fallback"** means the route-based breadcrumb from before this work. For example, an agreement shows `Home > Agreements > <Agreement>` whichever way you reached it.

Mark each row ✅ or ❌ as you go. If a row fails, note the URL and what the breadcrumb showed.

---

## A. List page → detail page

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| A1 | **Agreements** (nav) → **All Agreements** tab → click an agreement name | `Home > Agreements > <Agreement>` | |
| A2 | **Agreements** → **My Agreements** tab → click an agreement → click the `Agreements` crumb | You land on **My Agreements**, not All Agreements. URL is `/agreements?filter=my-agreements` | |
| A3 | **Budget Lines** → **My Budget Lines** tab → click an agreement name in a row → click the `Budget Lines` crumb | Detail shows `Home > Budget Lines > <Agreement>`. The crumb returns to **My Budget Lines** (`?filter=my-budget-lines`) | |
| A4 | **CANs** → click a CAN name | `Home > CANs > <CAN>` | |
| A5 | **Projects** → click a project title | `Home > Projects > <Project>` | |
| A6 | **Projects** → expand a row (chevron) → click an agreement tag | `Home > Projects > <Agreement>` | |
| A7 | **Portfolios** → **My Portfolios** tab → click a portfolio → click the `Portfolios` crumb | Detail shows `Home > Portfolios > <Portfolio>`. The crumb returns to **My Portfolios** (`/portfolios?tab=my`) | |
| A8 | **Reporting** (nav) → **Procurement Dashboard** → in *Procurement Details*, expand a step → click an agreement name. The dashboard only lists agreements with Executing budget lines in the current FY | `Home > Procurement Dashboard > <Agreement>` | |

## B. Moving between related items

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| B1 | Portfolios → a portfolio → **Portfolio Spending** tab → click an agreement in the budget lines table | `Home > Portfolios > <Portfolio> > <Agreement>` | |
| B2 | Portfolios → a portfolio → **Portfolio Funding** tab → click the name/details block on the left of a CAN card (only that part is a link) | `Home > Portfolios > <Portfolio> > <CAN>`. The CAN opens on **CAN Details** at the **current** FY, not the portfolio's FY (expected; the card link doesn't pass a FY) | |
| B3 | Continue from B2: **CAN Spending** tab → click an agreement in the budget lines table | `Home > Portfolios > <Portfolio> > <CAN> > <Agreement>` (4 levels) | |
| B4 | Projects → a project → **Project Spending** tab → click an agreement | `Home > Projects > <Project> > <Agreement>` | |
| B5 | Projects → a project → **Project Funding** tab → click a CAN | `Home > Projects > <Project> > <CAN>` | |
| B6 | CANs → a CAN → **CAN Spending** → click an agreement | `Home > CANs > <CAN> > <Agreement>` | |
| B7 | Open the **same agreement** via A1 and then via B1 | A1 shows `Home > Agreements > …`; B1 shows `Home > Portfolios > <Portfolio> > …`. The breadcrumb follows how you got there | |

## C. Switching tabs keeps the trail

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| C1 | From B2 (CAN reached from a portfolio), click **CAN Details**, **CAN Spending**, **CAN Funding** | All three show `Home > Portfolios > <Portfolio> > <CAN>` | |
| C2 | From B1 (agreement reached from a portfolio), click each enabled agreement tab: **Agreement Details**, **SCs & Budget Lines** (or **Grants & Budget Lines**), **Award & Modifications** (contracts and AAs only), **Procurement Tracker** (developed non-grants). Grants show only the first two tabs, and **Documents** is usually disabled | All show `Home > Portfolios > <Portfolio> > <Agreement>` | |
| C3 | Reach a project via A5, then switch **Project Details** / **Project Spending** / **Project Funding** | All show `Home > Projects > <Project>` | |
| C4 | Portfolio → switch **Portfolio Spending** / **Portfolio Funding** | Breadcrumb stays `Home > Portfolios > <Portfolio>` | |

## D. Crumbs go back to the tab and fiscal year you left

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| D1 | Portfolio → **Portfolio Funding** tab → change FY to a past year (e.g. 2024) → click a CAN card → click the `<Portfolio>` crumb | You land on **Portfolio Funding** (not Spending), and the FY selector shows **2024**. URL is `/portfolios/<id>/funding?fy=2024` | |
| D2 | CAN page → change FY to 2024 → **CAN Spending** → click an agreement → click the `<CAN>` crumb. (The FY selector is hidden while CAN Details or CAN Funding is in edit mode.) | You land on **CAN Spending** with FY **2024**. URL is `/cans/<id>/spending?fy=2024` | |
| D3 | Project → **Project Funding** → change FY → click a CAN → click the `<Project>` crumb | You land on **Project Funding** with the FY you picked | |
| D4 | Project → **Project Spending** → pick a non-default FY → click an agreement → click the `<Project>` crumb | You land on **Project Spending** with that FY selected | |
| D5 | From B3 (4 levels), click the middle `<CAN>` crumb | The CAN page shows `Home > Portfolios > <Portfolio> > <CAN>`; the portfolio context is kept | |
| D6 | From B3, click the `<Portfolio>` crumb | The portfolio page shows `Home > Portfolios > <Portfolio>`, on the tab you left (Funding) | |
| D7 | From B3, click the `Portfolios` crumb | The Portfolios list, on the tab you left (All or My) | |

## E. Browser Back, Forward and refresh

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| E1 | Do B3 (Portfolio → CAN → Agreement), then press browser **Back** | The CAN page shows `Home > Portfolios > <Portfolio> > <CAN>` | |
| E2 | Press **Back** again, then **Back** once more. (Tab clicks are history entries: B3 went portfolio → CAN Details → CAN Spending → agreement.) | First Back: **CAN Details** with `Home > Portfolios > <Portfolio> > <CAN>`. Second Back: the portfolio's **Portfolio Funding** tab with `Home > Portfolios > <Portfolio>` | |
| E3 | Press **Forward** three times | The agreement shows the full `Home > Portfolios > <Portfolio> > <CAN> > <Agreement>` again | |
| E4 | On the agreement from B3, **refresh** the page (F5 / Cmd-R) | The trail is unchanged after the reload | |
| E5 | On the CAN page from B2, switch to **CAN Funding**, then press **Back** | You're back on the previous CAN tab with the same trail | |

## F. No stale trails: direct entry falls back to the route breadcrumb

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| F1 | Copy the URL of the agreement from B1 and paste it into a **new browser tab** | Fallback: `Home > Agreements > <Agreement>` | |
| F2 | Open an agreement via B1 (portfolio trail). Then use the nav: **Agreements** → open the **same** agreement | `Home > Agreements > <Agreement>`; no portfolio crumb is carried over | |
| F3 | Open a CAN by typing `/cans/<id>` in the address bar | Fallback: `Home > CANs > <CAN>` | |
| F4 | Open an agreement from a link in the **Notification Center**, if one is available | Fallback: `Home > Agreements > …` | |

## G. Working on the same agreement keeps the trail

Start each row from an agreement opened via B1, so it has a portfolio trail.

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| G1 | **Agreement Details** → **Edit** → **Cancel** → confirm **Cancel Edits** | Still `Home > Portfolios > <Portfolio> > <Agreement>` | |
| G2 | **Agreement Details** → **Edit** → change a field (not the procurement shop, which opens an approval dialog) → **Save Changes** | Still the portfolio trail | |
| G3 | **SCs & Budget Lines** → **Edit** → **Cancel** → confirm **Cancel Edits** | Still the portfolio trail, on the budget lines tab | |
| G4 | **SCs & Budget Lines** → **Edit** → change something → **Save & Exit** (confirm **Send to Approval** if prompted; this appears when you change non-draft budget lines) | Still the portfolio trail, on the budget lines tab, after the success message | |
| G5 | **Procurement Tracker** → on step 5 click **Request Pre-Award Approval**. The button is enabled only when step 5 is the **active** step, pre-award approval hasn't already been requested, and no budget line is In Review | The approval page shows `Home > Portfolios > <Portfolio> > <Agreement> > Request Pre-Award Approval` | |
| G6 | On that approval page, click the `<Agreement>` crumb | You're back on the agreement's **Procurement Tracker** with `Home > Portfolios > <Portfolio> > <Agreement>` | |
| G7 | **Procurement Tracker** → step 6 **Request Award Approval** → fill in → **Send to Approval**. Needs step 6 active, step 5 complete, and a CLIN on every non-draft budget line | After the success message you return to the Procurement Tracker with `Home > Portfolios > <Portfolio> > <Agreement>`. The agreement must **not** appear twice | |
| G8 | On an approval page, click **Cancel** → confirm **Cancel Pre-Award** / **Cancel Award** | You go back one step in browser history (the Procurement Tracker) with its trail | |

## H. URL parameter edge cases

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| H1 | Open `/cans/<id>?fy=abc` | The page loads with the current FY; no errors, no blank numbers | |
| H2 | Open `/projects/<id>/funding?fy=All` | The page loads with the current FY | |
| H3 | Open `/projects/<id>/spending?fy=1999` (a year with no data) | The page uses its normal default: the current FY if it has data, otherwise the latest FY that does | |
| H4 | Open `/portfolios?tab=my` | The **My Portfolios** tab is selected | |
| H5 | On **My Portfolios**, click **Portfolios** in the top nav | The page switches to **All Portfolios** and the URL is `/portfolios`. The tab and URL never disagree | |

## I. Expected limitations (not bugs)

These behave as described on purpose. Note anything different.

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| I1 | **My Agreements** → hover over a row → click its **edit** (pencil) icon. The icon only appears on hover, for agreements you can edit | `Home > Agreements > <Agreement>`. The `Agreements` crumb goes to All Agreements, not My Agreements | |
| I2 | Agreements → **Find by ODN** with a value that matches exactly one agreement | Same as I1 | |
| I3 | From an agreement with a trail → **SCs & Budget Lines** → **Change BL Status** (bottom of the tab; goes to `/agreements/review/<id>`) | Fallback: `Home > Agreements > Change BL Status`. That page is outside the trail | |
| I4 | Project with a non-default FY on **Project Funding** → click the **Project Spending** tab | The FY resets (separate pages, same as on main). The breadcrumb trail stays | |
| I5 | Reach an approval page directly by URL, e.g. `/agreements/<id>/award-approval` | Fallback `Home > Agreements > Request Award Approval` (no agreement crumb), same as main | |
| I6 | On the **Request Pre-Award Approval** page (from G5), click **Edit** | Fallback: `Home > Agreements > Edit Agreement and Budget Lines`. That page is outside the trail | |

## J. Filters kept when coming back (PR #5998)

| # | Steps | Expected | ✅/❌ |
|---|---|---|---|
| J1 | **Portfolios** → apply a filter → open a portfolio → click the `Portfolios` crumb | The filter is still applied | |
| J2 | Same as J1 with a **budget** range filter → after returning, open **Filter** | The slider still spans the FY's real min/max (not $0–$100M) | |
| J3 | **Agreements** → apply a portfolio filter and change the FY → open an agreement → back via the crumb | The filter and FY are both kept | |
| J4 | **Agreements** or **Projects** → apply a portfolio filter → change the FY dropdown | The portfolio filter stays; only **Compare Fiscal Years** clears | |
| J5 | **Portfolios** → apply a filter → change the FY | The filters reset (Portfolios only) | |
| J6 | **CANs** → apply a filter → change the FY | The filters stay | |
| J7 | With filters applied, **refresh** the browser | The filters clear (in memory only, by design) | |
| J8 | With filters applied, **log out** and log back in | The filters are cleared. (Local login usually reloads the page, which clears them anyway, so a pass here doesn't prove the logout reset itself.) | |
| J9 | **Budget Lines** → apply a filter → open an agreement → back via the `Budget Lines` crumb | The filter is still applied | |
| J10 | **Procurement Dashboard** → apply a procurement shop or division filter → open an agreement → back via the crumb | The filter is still applied | |
| J11 | **Portfolios** list → change the FY → open a portfolio → back via the `Portfolios` crumb | The list FY is kept. (The portfolio also opens at that FY, because the row link carries `?fy=`.) On the #5995-only branch the list FY resets, which is expected there | |

---

## Reporting a failure

For each ❌, note:

- **Row:** the # (e.g. D2).
- **URL:** at the failing step, including the query string.
- **Breadcrumb:** what it showed, versus what was expected.
- **Path:** how you reached the page (the clicks), if it differs from the steps.
- **Browser:** and whether the console showed errors.
