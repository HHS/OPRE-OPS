import RoadmapStatusCard from "./RoadmapStatusCard";

/**
 * @component - "OPS at a Glance" tab content for the redesigned homepage: a header
 * followed by the Done / Currently Developing / Not Started Yet roadmap status board.
 * Data is mocked (see `data.js`) — real data wiring is handled separately (OPS-6331).
 * @returns {React.ReactElement}
 */
const OpsAtAGlanceContent = () => (
    <>
        <h2>OPS at a Glance</h2>
        <p>
            This is an overview of OPS development and current state including what&apos;s been done, what&apos;s in
            progress, and what is still to come.
        </p>
        <RoadmapStatusCard />
    </>
);

export default OpsAtAGlanceContent;
