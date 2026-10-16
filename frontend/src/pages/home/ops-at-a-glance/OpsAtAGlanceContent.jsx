import RoadmapStatusCard from "./RoadmapStatusCard";

/**
 * @component - "OPS at a Glance" tab content for the redesigned homepage: a header
 * followed by the Ready to Use / In Progress / Up Next / Later roadmap status board
 * (Figma's labels for the underlying Done / Currently Developing / Not Started Yet
 * statuses — see `ROADMAP_STATUS_LABELS` in `roadmapStatus.constants.js`).
 * Data is mocked (see `roadmapData.json`) — real data wiring is handled separately (OPS-6331).
 * @returns {React.ReactElement}
 */
const OpsAtAGlanceContent = () => (
    <>
        <h2>OPS at a Glance</h2>
        <p>
            This is an overview of OPS development and current state including what you can use today, what we&apos;re
            working on, and what&apos;s coming up next.
        </p>
        <RoadmapStatusCard />
    </>
);

export default OpsAtAGlanceContent;
