import Accordion from "../../../components/UI/Accordion";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { RELEASE_NOTES_TYPES } from "./constants";
import { data } from "./data";
import ReleaseNote from "./ReleaseNote";
import ReleaseNotesCards from "./ReleaseNotesCards";

// NOTE: if we decide to do dynamic implementation of ReleaseNotes we can replace the static data with the API response from useGetReleasesQuery from `api/github.js`
const ReleaseNotes = () => {
    if (!data || data.length === 0) return <p>No release notes available.</p>;

    const latestRelease = data[0];
    const prevReleases = data.slice(1);

    return (
        <>
            <h1 className="font-24px">OPS Release Summary</h1>
            <ReleaseNotesCards
                lastVersion={latestRelease.version}
                releaseDate={formatDateToMonthDayYear(latestRelease.releaseDate)}
                totalReleaseChanges={latestRelease.changes.length}
                totalFixes={latestRelease.changes.filter((change) => change.type === RELEASE_NOTES_TYPES.FIXES).length}
                totalNewFeatures={
                    latestRelease.changes.filter((change) => change.type === RELEASE_NOTES_TYPES.NEW_FEATURE).length
                }
                totalImprovements={
                    latestRelease.changes.filter((change) => change.type === RELEASE_NOTES_TYPES.IMPROVEMENTS).length
                }
            />
            <h2>Release Notes: {latestRelease.version}</h2>
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

export default ReleaseNotes;
