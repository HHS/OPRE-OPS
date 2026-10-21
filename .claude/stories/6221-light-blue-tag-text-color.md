---
issue: 6221
branch: OPS-6221/fix-tag-font-color
---

# Redo OPS home page to focus on whats new/next

## Goal

Change the text color on the homepage's light-blue tag pills from USWDS `#005ea2` to the
brand `#264A64`, matching the agreements-page filter tags. Follow-up styling fix carved out
of the already-delivered 6221 homepage redesign (see `6221-homepage-ux-review-fixes.md`,
where this was deferred as the "global tag text/background-color fix").

## Acceptance Criteria

- [ ] Text color in the light blue tags is `#264A64` instead of `#005ea2`
- [ ] "Up Next / Later" roadmap pills (OPS at a Glance tab + OPS Updates summary card) use the new color
- [ ] "Last Release" and "OPS Version" pills on the What's New summary card use the new color
- [ ] The WCAG contrast comment in `roadmapStatus.constants.js` reflects the new ratio

## Technical Details

### Approach

Swap USWDS `text-primary` (`#005ea2`) for the brand `text-brand-primary-dark`
(`--primary-dark: #264a64`), matching `FilterTags.jsx:20`. For the two `ReleaseNotesCards`
pills, use the existing named `Tag` variant `tagStyle="primaryDarkTextLightBackground"`
(`Tag.jsx:53`) rather than a hardcoded className — it already encodes this exact pair.
`roadmapStatus.constants.js` keeps a raw class string, since it's a status→class map.

### Key Files

- `frontend/src/pages/home/roadmapStatus.constants.js:26` — `ROADMAP_STATUS_TAG_CLASSES[NOT_STARTED]`; shared by `RoadmapStatusCard.jsx:65` and `CurrentlyDevelopingCard.jsx:55`
- `frontend/src/pages/home/roadmapStatus.constants.js:17-21` — header comment documents the old `~4.58:1` ratio and a "far less margin than the other two" caveat; both go stale
- `frontend/src/pages/home/release-notes/ReleaseNotesCards.jsx:38,46` — "Last Release" and "OPS Version" pills, currently hardcoded `className`
- `frontend/src/components/UI/Tag/Tag.jsx:53` — source of the `primaryDarkTextLightBackground` variant
- `frontend/src/components/UI/FilterTags/FilterTags.jsx:20` — reference implementation (target color)

### Testing Strategy

No new tests. `docs/TESTING.md:313` lists "Visual styling alone" under *When NOT to Write
Tests*, and no existing unit or Cypress test asserts classes on these three pills — the
class assertions in `RoadmapStatusCard.test.jsx`, `CurrentlyDevelopingCard.test.jsx`, and
`ReleaseNotesCards.test.jsx` all target *other* tags (Done, In Progress, Improvements), so
nothing breaks. Verify visually against Figma node-id=36712-59056.

### Constraints

- Scope is text color only. The earlier UX note asked for "text and background color in
  tags, globally"; the issue's follow-up comment narrows it to light-blue tag text.
- These three sites are the only `bg-brand-primary-light text-primary` pairs in the repo.
  Every other light-blue pill already uses `text-brand-primary-dark`.
- `text-primary` has ~70 other call sites on white/light-gray backgrounds — out of scope.
- `text-brand-primary-dark` is already in the committed compiled CSS
  (`frontend/src/uswds/css/styles.css`); no SASS rebuild needed.
- Contrast improves: 4.58:1 → 6.36:1 against `--primary-light: #bcd9ed` (verified).
