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
    meet WCAG AA contrast).
*/
export const ROADMAP_STATUS_TAG_CLASSES = {
    [ROADMAP_STATUS.DONE]: "bg-brand-can-budget-by-fy-graph-4 text-ink",
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "bg-brand-data-viz-bl-by-status-3 text-ink",
    [ROADMAP_STATUS.NOT_STARTED]: "bg-brand-primary-light text-primary"
};
