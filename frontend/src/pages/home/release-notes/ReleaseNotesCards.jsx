import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";

/**
 * @component - Displays a summary of the latest release notes, including release date, version, and counts of changes.
 * @param {Object} props - Component props.
 * @param {string} props.releaseDate - The date of the latest release.
 * @param {string} props.lastVersion - The version number of the latest release.
 * @param {number} props.totalReleaseChanges - Total number of changes in the latest release.
 * @param {number} props.totalNewFeatures - Number of new features in the latest release.
 * @param {number} props.totalFixes - Number of fixes in the latest release.
 * @param {number} props.totalImprovements - Number of improvements in the latest release.
 * @returns {React.ReactElement} The rendered release notes summary card.
 */
function ReleaseNotesCards({
    releaseDate,
    lastVersion,
    totalReleaseChanges,
    totalNewFeatures,
    totalFixes,
    totalImprovements
}) {
    return (
        <section className="notes">
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
                        <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                            Release Changes
                        </h3>
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
        </section>
    );
}

export default ReleaseNotesCards;
