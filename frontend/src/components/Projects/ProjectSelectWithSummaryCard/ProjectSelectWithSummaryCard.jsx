import { useEffect } from "react";
import ProjectComboBox from "../ProjectComboBox";

export const ProjectSelectWithSummaryCard = ({
    researchProjects,
    selectedResearchProject,
    setSelectedProject,
    setAgreementProjectId
}) => {
    useEffect(() => {
        if (setAgreementProjectId) {
            setAgreementProjectId(selectedResearchProject?.id);
        }
    }, [selectedResearchProject]);

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
