import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";

/**
 * @typedef ReleaseNotesCardProps
 * @property {string} releaseDate - The date of the latest release.
 * @property {string} lastVersion - The version number of the latest release.
 * @property {number} totalReleaseChanges - Total number of changes in the latest release.
 * @property {number} totalNewFeatures - Number of new features in the latest release.
 * @property {number} totalFixes - Number of fixes in the latest release.
 * @property {number} totalImprovements - Number of improvements in the latest release.
 */

/**
 * @component - Displays a summary of the latest release notes, including release date, version, and counts of changes.
 * @param {ReleaseNotesCardProps} props - Component props.
 * @returns {React.ReactElement} The rendered release notes summary card.
 */
const ReleaseNotesCards = ({
    releaseDate,
    lastVersion,
    totalReleaseChanges,
    totalNewFeatures,
    totalFixes,
    totalImprovements
}) => {
    return (
        <section className="display-flex flex-justify">
            <LeftCard
                releaseDate={releaseDate}
                lastVersion={lastVersion}
                totalReleaseChanges={totalReleaseChanges}
                totalNewFeatures={totalNewFeatures}
                totalFixes={totalFixes}
                totalImprovements={totalImprovements}
            />
            <RightCard releaseDate={releaseDate} />
        </section>
    );
};

/**
 * @component -  Displays a card showing the last data update date and a descriptive note.
 * @private
 * @param {Object} props - Component props.
 * @param {string} props.releaseDate - The date when the budget team's spreadsheet was last synced.
 * @returns {React.ReactElement} The rendered right card with the last data update information.
 */
function RightCard({ releaseDate }) {
    return (
        <RoundedBox id="project-agreement-bli-card">
            <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Last Data Update *</h3>
            <p className="font-sans-xl text-bold line-height-sans-1">{releaseDate}</p>
            <p className="margin-top-6 font-12px text-base-dark text-normal">
                * The date the budget team’s spreadsheet was synced into OPS. All changes submitted to the budget team
                before this date should be included.
            </p>
        </RoundedBox>
    );
}

/**
 * @component - LeftCard component displays the summary of the latest release notes.
 * @private
 * @param {ReleaseNotesCardProps} props - Component props.
 * @returns {React.ReactElement} The rendered left card.
 */
function LeftCard({ releaseDate, lastVersion, totalReleaseChanges, totalNewFeatures, totalFixes, totalImprovements }) {
    return (
        <RoundedBox id="project-agreement-bli-card">
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Last Release</h3>
                    <Tag
                        text={releaseDate}
                        className="bg-brand-primary-light text-brand-primary"
                    />
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">OPS Version</h3>
                    <Tag
                        text={`Version ${lastVersion}`}
                        className="bg-brand-primary-light text-brand-primary"
                    />
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Release Changes</h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalReleaseChanges}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {totalNewFeatures > 0 && (
                                <Tag className="bg-brand-primary text-white">
                                    {totalNewFeatures} {totalNewFeatures > 1 ? "New Features" : "New Feature"}
                                </Tag>
                            )}
                            {totalFixes > 0 && (
                                <Tag className="bg-brand-release-changes-fixes text-ink margin-top-1">
                                    {totalFixes} {totalFixes > 1 ? "Fixes" : "Fix"}
                                </Tag>
                            )}
                            {totalImprovements > 0 && (
                                <Tag className="bg-brand-can-budget-by-fy-graph-4 text-ink margin-top-1">
                                    {totalImprovements} {totalImprovements > 1 ? "Improvements" : "Improvement"}
                                </Tag>
                            )}
                        </div>
                    </div>
                </article>
            </div>
        </RoundedBox>
    );
}

export default ReleaseNotesCards;
