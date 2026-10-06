import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";
import { getRoadmapItemsByStatus } from "../roadmapData.helpers";
import { ROADMAP_STATUS } from "../roadmapStatus.constants";

const COLUMN_TAG_CLASSES = {
    [ROADMAP_STATUS.DONE]: "bg-brand-can-budget-by-fy-graph-4 text-ink",
    // text-white on this background fails WCAG AA contrast (3.24:1, needs 4.5:1) — text-ink
    // matches CurrentlyDevelopingCard's "Currently Developing" tag treatment.
    [ROADMAP_STATUS.CURRENTLY_DEVELOPING]: "bg-brand-data-viz-primary-3 text-ink",
    [ROADMAP_STATUS.NOT_STARTED]: "bg-brand-primary-light text-primary"
};

const NOT_STARTED_FOOTNOTE = "* Features are listed in alphabetical order, not the order they will be worked on";

/**
 * @component - Renders the "OPS at a Glance" roadmap status board: Done, Currently
 * Developing, and Not Started Yet columns, each with a count and Tag pills. Only the
 * "Not Started Yet" column is sorted alphabetically (per the Figma footnote) — the
 * other two render in `roadmapData.json`'s authored order. Shares that data (and the
 * `ROADMAP_STATUS` constant) with `CurrentlyDevelopingCard`, so the two surfaces can't
 * drift into disagreeing "Currently Developing" lists (see OPS-6331).
 * @returns {React.ReactElement}
 */
const RoadmapStatusCard = () => {
    const columns = [
        { status: ROADMAP_STATUS.DONE, items: getRoadmapItemsByStatus(ROADMAP_STATUS.DONE), footnote: null },
        {
            status: ROADMAP_STATUS.CURRENTLY_DEVELOPING,
            items: getRoadmapItemsByStatus(ROADMAP_STATUS.CURRENTLY_DEVELOPING),
            footnote: null
        },
        {
            status: ROADMAP_STATUS.NOT_STARTED,
            items: getRoadmapItemsByStatus(ROADMAP_STATUS.NOT_STARTED).sort((a, b) => a.title.localeCompare(b.title)),
            footnote: NOT_STARTED_FOOTNOTE
        }
    ];

    return (
        <RoundedBox
            dataCy="roadmap-status-card"
            style={{ width: "100%" }}
        >
            <div className="grid-row grid-gap">
                {columns.map((column) => (
                    <div
                        key={column.status}
                        className="grid-col-12 tablet:grid-col-4"
                        data-testid={`roadmap-column-${column.status}`}
                    >
                        <h3 className="margin-0 margin-bottom-3 font-12px text-base-dark text-normal">
                            {column.footnote ? `${column.status} *` : column.status}
                        </h3>
                        <span className="font-sans-xl text-bold line-height-sans-1">{column.items.length}</span>
                        <div className="display-flex flex-wrap margin-top-1">
                            {column.items.map((item) => (
                                <span
                                    key={item.id}
                                    className="padding-right-1 padding-bottom-1"
                                >
                                    <Tag
                                        text={item.title}
                                        className={COLUMN_TAG_CLASSES[column.status]}
                                    />
                                </span>
                            ))}
                        </div>
                        {column.footnote && <p className="font-12px text-base-dark margin-top-2">{column.footnote}</p>}
                    </div>
                ))}
            </div>
        </RoundedBox>
    );
};

export default RoadmapStatusCard;
