import ReleaseNotesList from "../release-notes/ReleaseNotesList";

/**
 * @component - "What's New" tab content for the redesigned homepage. Reuses the
 * release notes data/list rendering, with the latest release collapsed into an
 * Accordion like the older releases instead of always-expanded.
 * @returns {React.ReactElement}
 */
const WhatsNewContent = () => (
    <>
        <h2>What&apos;s New</h2>
        <p>
            This is a list of release notes and what&apos;s new in OPS including new features, fixes, and improvements.
        </p>
        <ReleaseNotesList wrapLatestInAccordion />
    </>
);

export default WhatsNewContent;
