import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import { LeftCard } from "./ReleaseNotesCards";
import { getReleaseTotals } from "./releaseNotes.helpers";

const ReleaseNotesSummaryCard = () => {
    if (!data || data.length === 0) return null;

    const latest = data[0];
    const totals = getReleaseTotals(latest);
    return (
        <div className="flex-fill">
            <LeftCard
                lastVersion={latest.version}
                releaseDate={formatDateToMonthDayYear(latest.releaseDate)}
                {...totals}
            />
        </div>
    );
};

export default ReleaseNotesSummaryCard;
