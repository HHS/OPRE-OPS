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
    the same roadmap items in different colors (confirmed via axe-core: all three combinations
    meet WCAG AA contrast — DONE's can-budget-by-fy-graph-3 green against text-ink is ~6.46:1).
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
*/
export const ROADMAP_STATUS_LABELS = {
    [ROADMAP_STATUS.DONE]: "Ready to Use",
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "In Progress",
    [ROADMAP_STATUS.NOT_STARTED]: "Up Next / Later*"
};
