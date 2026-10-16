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
    after the DONE and CURRENTLY_DEVELOPING color changes: DONE's can-budget-by-fy-graph-3 green
    against text-ink is ~6.45:1; CURRENTLY_DEVELOPING's data-viz-bl-by-status-3 orange against
    data-viz-bl-by-status-5 text is ~6.67:1; NOT_STARTED's primary-light blue against text-primary
    is ~4.58:1 — passes, but with far less margin than the other two (unchanged by this file's
    recent edits; re-check if this pairing's colors ever change).
*/
export const ROADMAP_STATUS_TAG_CLASSES = {
    [ROADMAP_STATUS.DONE]: "bg-brand-can-budget-by-fy-graph-3 text-ink",
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "bg-brand-data-viz-bl-by-status-3 text-brand-data-viz-bl-by-status-5",
    [ROADMAP_STATUS.NOT_STARTED]: "bg-brand-primary-light text-primary"
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
