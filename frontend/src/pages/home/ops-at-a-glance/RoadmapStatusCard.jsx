import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";
import { getRoadmapItemsByStatus } from "../roadmapData.helpers";
import { ROADMAP_STATUS, ROADMAP_STATUS_LABELS, ROADMAP_STATUS_TAG_CLASSES } from "../roadmapStatus.constants";
import styles from "./RoadmapStatusCard.module.scss";

const NOT_STARTED_FOOTNOTE = "* Features are listed in alphabetical order, not the order they will be worked on";
const NOT_STARTED_FOOTNOTE_ID = "roadmap-not-started-footnote";

/**
 * @component - Renders the "OPS at a Glance" roadmap status board: Ready to Use, In
 * Progress, and Up Next / Later columns (Figma's labels for the underlying Done /
 * Currently Developing / Not Started Yet statuses — see `ROADMAP_STATUS_LABELS`), each
 * with a count and Tag pills. Only the "Up Next / Later" column is sorted alphabetically
 * (per the Figma footnote) — the other two render in `roadmapData.json`'s authored order.
 * The footnote itself renders once below all three columns, left-aligned with "Ready to
 * Use" (per Figma), not nested under "Up Next / Later". Shares roadmap data (and the
 * `ROADMAP_STATUS` constant) with `CurrentlyDevelopingCard`, so the two surfaces can't
 * drift into disagreeing "Currently Developing" lists (see OPS-6331).
 * Column widths follow Figma: the outer two columns split the remaining space, while "In
 * Progress" stacks its tags and sizes to its widest one (capped at 1/3 on tablet and up).
 * @returns {React.ReactElement}
 */
const RoadmapStatusCard = () => {
    const columns = [
        {
            status: ROADMAP_STATUS.DONE,
            items: getRoadmapItemsByStatus(ROADMAP_STATUS.DONE),
            className: "tablet:grid-col-fill",
            tagsClassName: "flex-wrap",
            tagWrapperClassName: "padding-right-1 padding-bottom-1"
        },
        {
            status: ROADMAP_STATUS.CURRENTLY_DEVELOPING,
            items: getRoadmapItemsByStatus(ROADMAP_STATUS.CURRENTLY_DEVELOPING),
            className: `tablet:grid-col-auto ${styles.inProgressColumn}`,
            tagsClassName: "flex-column flex-align-start",
            // No right padding: it would widen this content-sized column past its widest tag
            tagWrapperClassName: "padding-bottom-1"
        },
        {
            status: ROADMAP_STATUS.NOT_STARTED,
            items: getRoadmapItemsByStatus(ROADMAP_STATUS.NOT_STARTED).sort((a, b) => a.title.localeCompare(b.title)),
            className: "tablet:grid-col-fill",
            tagsClassName: "flex-wrap",
            tagWrapperClassName: "padding-right-1 padding-bottom-1"
        }
    ];

    return (
        <RoundedBox
            dataCy="roadmap-status-card"
            style={{ width: "100%" }}
        >
            <div className="grid-row grid-gap-3">
                {columns.map((column) => (
                    <div
                        key={column.status}
                        className={`grid-col-12 ${column.className}`}
                        data-testid={`roadmap-column-${column.status}`}
                    >
                        <h3
                            className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal"
                            // Paired with the "*" baked into ROADMAP_STATUS_LABELS[NOT_STARTED] in
                            // roadmapStatus.constants.js — keep both in sync if the footnote moves.
                            aria-describedby={
                                column.status === ROADMAP_STATUS.NOT_STARTED ? NOT_STARTED_FOOTNOTE_ID : undefined
                            }
                        >
                            {ROADMAP_STATUS_LABELS[column.status]}
                        </h3>
                        <span className="font-sans-xl text-bold line-height-sans-1">{column.items.length}</span>
                        <div className={`display-flex ${column.tagsClassName} margin-top-1`}>
                            {column.items.map((item) => (
                                <span
                                    key={item.id}
                                    className={column.tagWrapperClassName}
                                >
                                    <Tag
                                        text={item.title}
                                        className={ROADMAP_STATUS_TAG_CLASSES[column.status]}
                                    />
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <p
                id={NOT_STARTED_FOOTNOTE_ID}
                className="font-12px text-base-dark margin-top-2 margin-bottom-0"
            >
                {NOT_STARTED_FOOTNOTE}
            </p>
        </RoundedBox>
    );
};

export default RoadmapStatusCard;
