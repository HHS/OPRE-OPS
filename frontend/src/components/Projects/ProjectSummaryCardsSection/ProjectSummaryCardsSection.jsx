import ProjectCountSummaryCard from "../ProjectCountSummaryCard";
import ProjectTypeSummaryCard from "../ProjectTypeSummaryCard";

/**
 * ProjectSummaryCardsSection component
 * Renders two side-by-side summary cards for the projects list page:
 * a count card and a project-type breakdown card.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} props.fiscalYear - The display string for the fiscal year (e.g. "FY 2025" or "All FYs")
 * @param {Object} props.summary - Backend-computed aggregate summary across all filtered projects
 * @returns {React.ReactElement} - The rendered component
 */
const ProjectSummaryCardsSection = ({ fiscalYear, summary }) => {
    return (
        <div className="display-flex flex-justify">
            <ProjectCountSummaryCard
                title={`${fiscalYear} Projects`}
                summary={summary}
            />
            <ProjectTypeSummaryCard
                title={`${fiscalYear} Projects by Type`}
                summary={summary}
            />
        </div>
    );
};

export default ProjectSummaryCardsSection;
