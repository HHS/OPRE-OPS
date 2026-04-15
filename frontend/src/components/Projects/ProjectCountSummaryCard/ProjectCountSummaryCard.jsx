import {
    PROJECT_TYPE_COLORS,
    PROJECT_TYPE_LABELS,
    PROJECT_TYPE_ORDER,
    PROJECT_TYPE_TEXT_COLORS
} from "../ProjectTypes.constants";
import RoundedBox from "../../UI/RoundedBox";
import Tag from "../../UI/Tag";

/**
 * ProjectCountSummaryCard component
 * Displays the total number of projects and a breakdown by project type.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.title - The heading for the card
 * @param {Object} props.summary - Backend-computed aggregate summary across all filtered projects
 * @param {number} props.summary.total_projects - Total count of all matching projects
 * @param {Object} props.summary.projects_by_type - Count of projects per type
 * @returns {React.ReactElement} - The rendered component
 */
const ProjectCountSummaryCard = ({ title, summary }) => {
    const totalCount = summary?.total_projects ?? 0;
    const projectsByType = summary?.projects_by_type ?? {};

    const typeCounts = PROJECT_TYPE_ORDER.filter((type) => projectsByType[type] !== undefined).map((type) => ({
        type,
        count: projectsByType[type]
    }));

    return (
        <RoundedBox
            id="project-count-summary-card"
            dataCy="project-count-summary-card"
        >
            <h3 className="margin-0 margin-bottom-2 font-12px text-base-dark text-normal">{title}</h3>
            <span className="font-sans-xl text-bold line-height-sans-1">{totalCount}</span>
            <div className="display-flex flex-column flex-align-start grid-gap margin-top-2">
                {typeCounts.map(({ type, count }, index) => (
                    <Tag
                        key={type}
                        className={`${index > 0 ? "margin-top-1" : ""}`}
                        style={{ backgroundColor: PROJECT_TYPE_COLORS[type], color: PROJECT_TYPE_TEXT_COLORS[type] }}
                        text={`${count} ${PROJECT_TYPE_LABELS[type] ?? type}`}
                    />
                ))}
            </div>
        </RoundedBox>
    );
};

export default ProjectCountSummaryCard;
