import Accordion from "../../../components/UI/Accordion";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import ReleaseNote from "./ReleaseNote";

/**
 * @component - Renders the release notes list for the "What's New" tab: the latest
 * release in an open Accordion (per Figma), followed by older releases each in a
 * closed Accordion. Headings are level 3 to nest under the tab's own h2.
 * @returns {React.ReactElement}
 */
const ReleaseNotesList = () => {
    if (!data || data.length === 0) return <p>No release notes available.</p>;

    const [latestRelease, ...prevReleases] = data;
    const latestHeading = `Release Notes ${latestRelease.version} - ${formatDateToMonthDayYear(latestRelease.releaseDate)}`;
    const latestChanges = latestRelease.changes.map((change) => (
        <ReleaseNote
            key={change.id}
            subject={change.subject}
            type={change.type}
            description={change.description}
        />
    ));

    return (
        <>
            <Accordion
                heading={latestHeading}
                level={3}
            >
                {latestChanges}
            </Accordion>

            {prevReleases.length > 0 &&
                prevReleases.map((release) => (
                    <Accordion
                        key={release.version}
                        heading={`Release Notes ${release.version} - ${formatDateToMonthDayYear(release.releaseDate)}`}
                        level={3}
                        isClosed
                    >
                        {release.changes.map((change) => (
                            <ReleaseNote
                                key={change.id}
                                subject={change.subject}
                                type={change.type}
                                description={change.description}
                            />
                        ))}
                    </Accordion>
                ))}
        </>
    );
};

export default ReleaseNotesList;
