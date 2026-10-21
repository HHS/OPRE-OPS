/*
    NOTE: Shared by CurrentlyDevelopingCard (every tab's "OPS Updates" summary) and
    RoadmapStatusCard (OPS at a Glance tab) — both filter the same `roadmapData.json`
    by these status values, so the two surfaces can't drift into disagreeing lists again
    (see OPS-6331).
*/
export const ROADMAP_STATUS = {
    DONE: "Done",
    CURRENTLY_DEVELOPING: "Currently Developing",
    NOT_STARTED: "Not Started Yet"
};

/*
    NOTE: Also shared by both surfaces above, for the same reason — each status gets exactly
    one Tag color, defined once, so CurrentlyDevelopingCard and RoadmapStatusCard can't render
    the same roadmap items in different colors. WCAG AA contrast (4.5:1) for all three, recomputed
    after the DONE, CURRENTLY_DEVELOPING and NOT_STARTED color changes: DONE's
    can-budget-by-fy-graph-3 green against text-ink is ~6.45:1; CURRENTLY_DEVELOPING's
    data-viz-bl-by-status-3 orange against data-viz-bl-by-status-5 text is ~6.67:1;
    NOT_STARTED's primary-light blue against brand-primary-dark text is ~6.36:1. All three now
    sit in the same 6.3–6.7 band — re-check if any of these pairings' colors ever change.

    NOT_STARTED previously paired this background with `text-primary`, which is USWDS's own
    #005ea2 rather than the brand --primary token, for ~4.58:1. OPS-6221 moved it onto the
    brand palette (#264a64) to match the agreements-page filter tags (FilterTags.jsx).
*/
export const ROADMAP_STATUS_TAG_CLASSES = {
    [ROADMAP_STATUS.DONE]: "bg-brand-can-budget-by-fy-graph-3 text-ink",
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "bg-brand-data-viz-bl-by-status-3 text-brand-data-viz-bl-by-status-5",
    [ROADMAP_STATUS.NOT_STARTED]: "bg-brand-primary-light text-brand-primary-dark"
};

/*
    NOTE: Figma-facing column labels for the "OPS at a Glance" roadmap board — distinct from
    the `ROADMAP_STATUS` values above, which stay as-is since they're also the literal
    `status` strings in roadmapData.json and the filter keys shared with CurrentlyDevelopingCard.
    Figma renamed these columns without changing the underlying status taxonomy.

    NOT_STARTED's trailing "*" here is paired with `RoadmapStatusCard`'s `aria-describedby`
    wiring (keyed off `column.status === ROADMAP_STATUS.NOT_STARTED`), which links this
    column's heading to the footnote the asterisk refers to. If NOT_STARTED's footnote ever
    moves to a different column, update both this string and that condition together.
*/
export const ROADMAP_STATUS_LABELS = {
    [ROADMAP_STATUS.DONE]: "Ready to Use",
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "In Progress",
    [ROADMAP_STATUS.NOT_STARTED]: "Up Next / Later*"
};
