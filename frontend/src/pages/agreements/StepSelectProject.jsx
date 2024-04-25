import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import ProjectSelectWithSummaryCard from "../../components/Projects/ProjectSelectWithSummaryCard";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import { useGetResearchProjectsQuery, useDeleteAgreementMutation } from "../../api/opsAPI";
import {
    useEditAgreement,
    useSetState,
    useUpdateAgreement
} from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";
import EditModeTitle from "./EditModeTitle";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import useAlert from "../../hooks/use-alert.hooks";

/**
 * Renders a step in the Create Agreement wizard for selecting a research project.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to go to the next step in the wizard. - optional
 * @param {boolean} [props.isEditMode] - Whether the form is in edit mode. - optional
 * @param {boolean} [props.isReviewMode] - Whether the form is in review mode. - optional
 * @param {Array.<string>} [props.wizardSteps] - The steps of the wizard. - optional
 * @param {number} [props.selectedAgreementId] - The ID of the selected agreement. - optional
 * @param {number} [props.currentStep] - The current step of the wizard. - optional
 * @param {string} [props.cancelHeading] - The heading for the cancel modal. - optional
 *
 * @returns {JSX.Element} - The rendered component.
 */
export const StepSelectProject = ({
    goToNext,
    isEditMode,
    isReviewMode,
    wizardSteps,
    currentStep,
    selectedAgreementId,
    cancelHeading
}) => {
    const navigate = useNavigate();
    const { selected_project: selectedResearchProject } = useEditAgreement();
    // setters
    const setSelectedProject = useSetState("selected_project");
    const setAgreementProjectId = useUpdateAgreement("project_id");

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const { setAlert } = useAlert();
    const { data: projects, error: errorProjects, isLoading: isLoadingProjects } = useGetResearchProjectsQuery();
    const [deleteAgreement] = useDeleteAgreementMutation();

    if (isLoadingProjects) {
        return <div>Loading...</div>;
    }
    if (errorProjects) {
        return <div>Oops, an error occurred</div>;
    }

    const handleContinue = () => {
        if (selectedResearchProject?.id) {
            goToNext({ project: selectedResearchProject.id });
        }
    };
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: cancelHeading,
            actionButtonText: "Cancel Agreement",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                setModalProps({});
                if (selectedAgreementId && !isEditMode && !isReviewMode) {
                    deleteAgreement(selectedAgreementId)
                        .unwrap()
                        .then((fulfilled) => {
                            console.log(`DELETE agreement success: ${JSON.stringify(fulfilled, null, 2)}`);
                            setAlert({
                                type: "success",
                                heading: "Create New Agreement Cancelled",
                                message: "Your agreement has been cancelled.",
                                redirectUrl: "/agreements"
                            });
                        })
                        .catch((rejected) => {
                            console.error(`DELETE agreement rejected: ${JSON.stringify(rejected, null, 2)}`);
                            setAlert({
                                type: "error",
                                heading: "Error",
                                message: "An error occurred while deleting the agreement.",
                                redirectUrl: "/error"
                            });
                        });
                } else {
                    setAlert({
                        type: "success",
                        heading: "Agreement Edits Cancelled",
                        message: "Your agreement edits have been cancelled.",
                        redirectUrl: "/agreements"
                    });
                }
            }
        });
    };

    const handleAddProject = () => {
        navigate("/projects/create");
    };

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <EditModeTitle isEditMode={isEditMode || isReviewMode} />
            <StepIndicator
                steps={wizardSteps}
                currentStep={currentStep}
            />
            <h2 className="font-sans-lg">Select a Project</h2>
            <p>
                Select a project the agreement should be associated with. If you need to create a new project, click Add
                New Project.
            </p>
            <ProjectSelectWithSummaryCard
                researchProjects={projects}
                selectedResearchProject={selectedResearchProject}
                setSelectedProject={setSelectedProject}
                setAgreementProjectId={setAgreementProjectId}
            />
            <div className="grid-row flex-justify-end margin-top-8">
                <button
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-button"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    id={"continue"}
                    className="usa-button"
                    onClick={handleContinue}
                    disabled={!selectedResearchProject?.id}
                >
                    Continue
                </button>
            </div>
            <div className="display-flex flex-align-center margin-top-6">
                <div className="border-bottom-1px border-base-light width-full" />
                <span className="text-base margin-left-2 margin-right-2">or</span>
                <div className="border-bottom-1px border-base-light width-full" />
            </div>
            <div className="grid-row flex-justify-center">
                <button
                    className="usa-button usa-button--outline margin-top-6 margin-bottom-6"
                    onClick={handleAddProject}
                >
                    Add New Project
                </button>
            </div>
        </>
    );
};

StepSelectProject.propTypes = {
    goToNext: PropTypes.func,
    isEditMode: PropTypes.bool,
    isReviewMode: PropTypes.bool,
    wizardSteps: PropTypes.arrayOf(PropTypes.string),
    currentStep: PropTypes.number,
    selectedAgreementId: PropTypes.number,
    cancelHeading: PropTypes.string
};
export default StepSelectProject;
