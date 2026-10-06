import Accordion from "../../../components/UI/Accordion";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import ReleaseNote from "./ReleaseNote";

/**
 * @component - Renders the release notes list: the latest release followed by older
 * releases, each older release in a closed Accordion.
 * @param {Object} props
 * @param {boolean} [props.wrapLatestInAccordion=false] - When true, renders the latest
 * release in a closed Accordion like the older releases, instead of a plain always-expanded section.
 * @returns {React.ReactElement}
 */
const ReleaseNotesList = ({ wrapLatestInAccordion = false }) => {
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
            {wrapLatestInAccordion ? (
                <Accordion
                    heading={latestHeading}
                    level={2}
                    isClosed
                >
                    {latestChanges}
                </Accordion>
            ) : (
                <>
                    <h2>Release Notes: {latestRelease.version}</h2>
                    <section
                        className="margin-bottom-8"
                        id="latest-release-notes"
                    >
                        {latestChanges}
                    </section>
                </>
            )}

            {prevReleases.length > 0 &&
                prevReleases.map((release) => (
                    <Accordion
                        key={release.version}
                        heading={`Release Notes ${release.version} - ${formatDateToMonthDayYear(release.releaseDate)}`}
                        level={2}
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
