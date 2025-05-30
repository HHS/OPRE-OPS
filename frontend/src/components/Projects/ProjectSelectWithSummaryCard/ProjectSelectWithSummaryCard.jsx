import { useEffect } from "react";
import ProjectComboBox from "../ProjectComboBox";

/**
 * A component that renders a project selection dropdown with a summary card.
 * When a project is selected, it displays the project details in a card format.
 *
 * @param {Object} props - The component props
 * @param {import("../../../types/ProjectTypes").ResearchProject[]} props.researchProjects - Array of available research projects to select from
 * @param {import("../../../types/ProjectTypes").ResearchProject} props.selectedResearchProject - The currently selected research project object
 * @param {Function} props.setSelectedProject - Callback function to update the selected project
 * @param {Function} [props.setAgreementProjectId] - Optional callback to set the agreement project ID when selection changes
 * @returns {React.ReactElement} A flex container with project selection dropdown and summary card
 */
const ProjectSelectWithSummaryCard = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    setAgreementProjectId
}) => {
    useEffect(() => {
        if (selectedResearchProject?.id) {
            setAgreementProjectId?.(selectedResearchProject.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedResearchProject]);

    /**
     * A card component that displays a summary of a selected research project.
     * Shows the project title and optional description in a styled card layout.
     *
     * @component
     * @param {Object} props - The component props
     * @param {import("../../../types/ProjectTypes").ResearchProject} props.selectedResearchProject - The research project object to display
     * @private
     * @returns {React.ReactElement} A card displaying the project title and description
     */
    const ProjectSummaryCard = ({ selectedResearchProject }) => {
        const { title, description } = selectedResearchProject;
        return (
            <div
                className="bg-base-lightest font-family-sans font-12px border-1px border-base-light radius-sm margin-top-4"
                style={{ width: "23.9375rem", minHeight: "7.5625rem" }}
                data-cy="project-summary-card"
                data-testid="project-summary-card"
            >
                <dl className="margin-0 padding-y-2 padding-x-105">
                    <dt className="margin-0 text-base-dark">Project</dt>
                    <dd className="text-semibold margin-0">{title}</dd>
                    {description && <dt className="margin-0 text-base-dark margin-top-205">Description</dt>}
                    <dd
                        className="text-semibold margin-0"
                        style={{ maxWidth: "15.625rem" }}
                    >
                        {description}
                    </dd>
                </dl>
            </div>
        );
    };

    return (
        <div className="display-flex flex-justify padding-top-105">
            {/* NOTE: Left side */}
            <ProjectComboBox
                researchProjects={researchProjects}
                selectedResearchProject={selectedResearchProject}
                setSelectedProject={setSelectedProject}
                legendClassname="usa-label margin-top-0 padding-bottom-1"
                overrideStyles={{ width: "23.9rem" }}
            />
            {/* NOTE: Right side */}
            <div className="right-half">
                {selectedResearchProject?.id && (
                    <ProjectSummaryCard selectedResearchProject={selectedResearchProject} />
                )}
            </div>
        </div>
    );
};

export default ProjectSelectWithSummaryCard;
