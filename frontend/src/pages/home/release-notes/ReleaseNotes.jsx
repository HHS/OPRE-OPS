import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { RELEASE_NOTES_TYPES } from "./constants";
import { data } from "./data";
import ReleaseNotesCards from "./ReleaseNotesCards";
import ReleaseNotesList from "./ReleaseNotesList";

// NOTE: if we decide to do dynamic implementation of ReleaseNotes we can replace the static data with the API response from useGetReleasesQuery from `api/github.js`
const ReleaseNotes = () => {
    if (!data || data.length === 0) return <p>No release notes available.</p>;

    const latestRelease = data[0];

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
            <ReleaseNotesList />
        </>
    );
};

export default ReleaseNotes;
