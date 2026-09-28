import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";
import { RELEASE_NOTES_TAG_CLASSES } from "./constants";
import { data } from "./data";
import { summarizeRelease } from "./releaseNotes.helpers";

/**
 * @typedef {import("./releaseNotes.helpers").Release} Release
 */

const COLUMN_LABEL_CLASSES = "margin-0 margin-bottom-2 font-12px text-base-dark text-normal";
const DATE_TAG_CLASSES = "bg-brand-primary-light text-brand-primary-dark";

/**
 * @typedef {Object} ReleaseSummaryCardProps
 * @property {Release} [release] - The release to summarize. Defaults to the most recent release.
 */

/**
 * @component - Summary card showing the date, version, and change counts of the latest OPS release.
 * @param {ReleaseSummaryCardProps} props - The properties passed to the component.
 * @returns {JSX.Element|null} The rendered component, or null when there is no release to show.
 */
const ReleaseSummaryCard = ({ release = data[0] }) => {
    const summary = summarizeRelease(release);

    if (!summary) return null;

    return (
        <RoundedBox
            className="height-full"
            dataCy="release-summary-card"
        >
            <div className="grid-row grid-gap">
                <div className="grid-col-4">
                    <h3 className={COLUMN_LABEL_CLASSES}>Last Release</h3>
                    <Tag
                        text={summary.releaseDate ?? "--"}
                        className={DATE_TAG_CLASSES}
                    />
                </div>
                <div className="grid-col-4">
                    <h3 className={COLUMN_LABEL_CLASSES}>OPS Version</h3>
                    <Tag
                        text={`Version ${summary.version}`}
                        className={DATE_TAG_CLASSES}
                    />
                </div>
                <div className="grid-col-4">
                    <h3 className={COLUMN_LABEL_CLASSES}>Release Changes</h3>
                    <p className="margin-0 font-sans-xl text-bold line-height-sans-1">{summary.totalChanges}</p>
                    <ul className="usa-list usa-list--unstyled margin-top-1">
                        {summary.changeCounts.map(({ type, label }) => (
                            <li
                                key={type}
                                className="margin-bottom-1"
                            >
                                <Tag
                                    text={label}
                                    className={RELEASE_NOTES_TAG_CLASSES[type]}
                                />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </RoundedBox>
    );
};

export default ReleaseSummaryCard;
