import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import ReleaseNotesCards from "./ReleaseNotesCards";
import ReleaseNotesList from "./ReleaseNotesList";
import { getReleaseTotals } from "./releaseNotes.helpers";

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
                {...getReleaseTotals(latestRelease)}
            />
            <ReleaseNotesList />
        </>
    );
};

export default ReleaseNotes;
