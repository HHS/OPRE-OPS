import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";
import { RELEASE_NOTES_TYPE_CLASSES, RELEASE_NOTES_TYPES } from "./constants";

const RELEASE_CHANGES_FOOTNOTE_ID = "release-changes-footnote";

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
 * @component - Displays the summary of the latest release notes: release date, version,
 * and counts of changes. Headings are h3 to nest under the homepage's "OPS Updates" h2.
 * @param {ReleaseNotesCardProps} props - Component props.
 * @returns {React.ReactElement} The rendered left card.
 */
export function LeftCard({
    releaseDate,
    lastVersion,
    totalReleaseChanges,
    totalNewFeatures,
    totalFixes,
    totalImprovements
}) {
    return (
        <RoundedBox style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="display-flex flex-justify">
                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">Last Release</h3>
                    <Tag
                        text={releaseDate}
                        className="bg-brand-primary-light text-primary"
                    />
                </article>

                <article>
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">OPS Version</h3>
                    <Tag
                        text={`Version ${lastVersion}`}
                        className="bg-brand-primary-light text-primary"
                    />
                </article>

                <article>
                    <h3
                        className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal"
                        aria-describedby={RELEASE_CHANGES_FOOTNOTE_ID}
                    >
                        Release Changes *
                    </h3>
                    <div>
                        <span className="font-sans-xl text-bold line-height-sans-1">{totalReleaseChanges}</span>
                        <div className="display-flex flex-column grid-gap margin-top-1">
                            {totalNewFeatures > 0 && (
                                <Tag className={RELEASE_NOTES_TYPE_CLASSES[RELEASE_NOTES_TYPES.NEW_FEATURE]}>
                                    {totalNewFeatures} {totalNewFeatures > 1 ? "New Features" : "New Feature"}
                                </Tag>
                            )}
                            {totalFixes > 0 && (
                                <Tag
                                    className={`${RELEASE_NOTES_TYPE_CLASSES[RELEASE_NOTES_TYPES.FIXES]} margin-top-1`}
                                >
                                    {totalFixes} {totalFixes > 1 ? "Fixes" : "Fix"}
                                </Tag>
                            )}
                            {totalImprovements > 0 && (
                                <Tag
                                    className={`${RELEASE_NOTES_TYPE_CLASSES[RELEASE_NOTES_TYPES.IMPROVEMENTS]} margin-top-1`}
                                >
                                    {totalImprovements} {totalImprovements > 1 ? "Improvements" : "Improvement"}
                                </Tag>
                            )}
                        </div>
                    </div>
                </article>
            </div>
            <p
                id={RELEASE_CHANGES_FOOTNOTE_ID}
                className="font-12px text-base-dark margin-bottom-0"
                style={{ marginTop: "auto" }}
            >
                * See more detail on the What&apos;s New tab below
            </p>
        </RoundedBox>
    );
}
