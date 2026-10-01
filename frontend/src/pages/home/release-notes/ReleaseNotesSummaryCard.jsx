import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { RELEASE_NOTES_TYPES } from "./constants";
import { data } from "./data";
import { LeftCard } from "./ReleaseNotesCards";

const ReleaseNotesSummaryCard = () => {
    if (!data || data.length === 0) return null;

    const latest = data[0];
    return (
        <div style={{ flex: 1 }}>
            <LeftCard
                lastVersion={latest.version}
                releaseDate={formatDateToMonthDayYear(latest.releaseDate)}
                totalReleaseChanges={latest.changes.length}
                totalFixes={latest.changes.filter((c) => c.type === RELEASE_NOTES_TYPES.FIXES).length}
                totalNewFeatures={latest.changes.filter((c) => c.type === RELEASE_NOTES_TYPES.NEW_FEATURE).length}
                totalImprovements={latest.changes.filter((c) => c.type === RELEASE_NOTES_TYPES.IMPROVEMENTS).length}
            />
        </div>
    );
};

export default ReleaseNotesSummaryCard;
