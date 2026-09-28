import Accordion from "../../../components/UI/Accordion";
import SectionHeading from "../../../components/UI/SectionHeading";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import ReleaseNote from "./ReleaseNote";

// NOTE: if we decide to do dynamic implementation of ReleaseNotes we can replace the static data with the API response from useGetReleasesQuery from `api/github.js`

/**
 * @component - The "What's New" home page tab: the latest release notes plus collapsed prior releases.
 * @returns {JSX.Element} The rendered component.
 */
const ReleaseNotes = () => {
    if (!data || data.length === 0) return <p>No release notes available.</p>;

    const [latestRelease, ...prevReleases] = data;

    return (
        <>
            <SectionHeading
                title={`Release Notes ${latestRelease.version}`}
                instructions="This is a list of what's new from our latest release."
                dataCy="latest-release-heading"
            />
            <section
                className="margin-bottom-8"
                id="latest-release-notes"
            >
                {latestRelease.changes.map((change) => (
                    <ReleaseNote
                        key={change.id}
                        subject={change.subject}
                        type={change.type}
                        description={change.description}
                    />
                ))}
            </section>

            {prevReleases.map((release) => (
                <div
                    key={release.version}
                    className="margin-bottom-2"
                >
                    <Accordion
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
                </div>
            ))}
        </>
    );
};

export default ReleaseNotes;
