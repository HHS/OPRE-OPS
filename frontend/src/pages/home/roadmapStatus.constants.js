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
