import RoundedBox from "../../../components/UI/RoundedBox";
import Tag from "../../../components/UI/Tag";
import { IN_PROGRESS_STATUSES, STATUSES } from "./constants";
import { data } from "./data";

/**
 * @typedef {Object} Priority
 * @property {number} id - Unique id for the priority.
 * @property {number} priority - Rank used to order the list ascending.
 * @property {string} title - Short name of the roadmap item.
 * @property {string} status - One of STATUSES.
 * @property {string} [levelOfEffort] - One of LEVELS_OF_EFFORT.
 */

const COLUMN_LABEL_CLASSES = "margin-0 margin-bottom-2 font-12px text-base-dark text-normal";
// NOTE: the design specifies primary-dark text on the amber "Currently Developing" tags, which falls
// below the WCAG AA 4.5:1 contrast ratio at this font size. Ink is used instead.
const DEVELOPING_TAG_CLASSES = "bg-brand-feedback-warning text-ink";
const NEXT_UP_TAG_CLASSES = "bg-brand-primary-light text-brand-primary-dark";

/**
 * @component - A column of roadmap priority tags with an empty state.
 * @private
 * @param {Object} props - The properties passed to the component.
 * @param {string} props.title - The column heading.
 * @param {Priority[]} props.priorities - The priorities to list.
 * @param {string} props.tagClassName - Tag color classes for this column.
 * @returns {JSX.Element} The rendered component.
 */
function PriorityColumn({ title, priorities, tagClassName }) {
    return (
        <div className="tablet:grid-col-6">
            <h3 className={COLUMN_LABEL_CLASSES}>{title}</h3>
            {priorities.length === 0 ? (
                <p className="margin-0 font-12px text-base-dark">Nothing at this time</p>
            ) : (
                <ul className="usa-list usa-list--unstyled">
                    {priorities.map((priority) => (
                        <li
                            key={priority.id}
                            className="margin-bottom-1"
                        >
                            <Tag
                                text={priority.title}
                                className={tagClassName}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/**
 * @typedef {Object} PrioritiesSummaryCardProps
 * @property {Priority[]} [priorities] - The roadmap priorities. Defaults to the static roadmap data.
 */

/**
 * @component - Summary card grouping roadmap priorities into what the team is building now and what is next.
 * @param {PrioritiesSummaryCardProps} props - The properties passed to the component.
 * @returns {JSX.Element} The rendered component.
 */
const PrioritiesSummaryCard = ({ priorities = data }) => {
    const byPriority = [...priorities].sort((a, b) => a.priority - b.priority);
    const currentlyDeveloping = byPriority.filter((item) => IN_PROGRESS_STATUSES.includes(item.status));
    const nextUp = byPriority.filter((item) => item.status === STATUSES.NOT_STARTED);

    return (
        <RoundedBox
            className="height-full"
            dataCy="priorities-summary-card"
        >
            <div className="grid-row grid-gap">
                <PriorityColumn
                    title="Currently Developing"
                    priorities={currentlyDeveloping}
                    tagClassName={DEVELOPING_TAG_CLASSES}
                />
                <PriorityColumn
                    title="Next Up"
                    priorities={nextUp}
                    tagClassName={NEXT_UP_TAG_CLASSES}
                />
            </div>
        </RoundedBox>
    );
};

export default PrioritiesSummaryCard;
