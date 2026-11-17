import React from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteAgreementMutation, useGetAllProjectsQuery } from "../../api/opsAPI";
import {
    useEditAgreement,
    useSetState,
    useUpdateAgreement
} from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";
import ProjectSelectWithSummaryCard from "../../components/Projects/ProjectSelectWithSummaryCard";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import { SaveChangesAndExitModal } from "../../components/UI/Modals/SaveChangesAndExitModal";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import useAlert from "../../hooks/use-alert.hooks";
import useHasStateChanged from "../../hooks/useHasStateChanged.hooks";
import useUnsavedChangesBlocker from "../../hooks/useUnsavedChangesBlocker.hooks";
import EditModeTitle from "./EditModeTitle";

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
 * @returns {React.ReactElement} - The rendered component.
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
    /** @type {{data?: import("../../types/ProjectTypes").Project[] | undefined, error?: Object, isLoading: boolean}} */
    const {
        data: projects,
        error: errorProjects,
        isLoading: isLoadingProjects
    } = useGetAllProjectsQuery(undefined, { refetchOnMountOrArgChange: true });
    const [deleteAgreement] = useDeleteAgreementMutation();

    // Browser-Back guard (OPS-1081): selecting a project here is local context state that
    // nothing else protects — unlike steps 2/3, which already have their own blockers via
    // useNavigationBlocker/useBlocker. Compare against the project id (not the whole object)
    // so edit mode's pre-populated selected_project doesn't read as "changed" on mount.
    // Wrapped in an object because useHasStateChanged spreads its argument into a plain
    // object snapshot — a bare null/undefined would spread to {} and immediately mismatch.
    const hasProjectChanged = useHasStateChanged({ id: selectedResearchProject?.id ?? null });
    const { showBlockerModal, blockerModalProps, isBypassingRef } = useUnsavedChangesBlocker({
        // Suppress while the in-wizard Cancel dialog is already open (showModal), so browser
        // Back can't pop this blocker's modal on top of that one — they share hardcoded DOM
        // ids and each registers its own keydown trap, so both mounted at once is an a11y bug.
        hasChanged: hasProjectChanged && !showModal,
        heading: "Leave without finishing?",
        description: "You have unsaved changes. If you leave without saving, these changes will be lost.",
        actionButtonText: "Go back",
        secondaryButtonText: "Leave without saving"
    });

    if (isLoadingProjects) {
        return <div>Loading...</div>;
    }
    if (errorProjects) {
        navigate("/error");
        return;
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
                // Bypass the unsaved-changes blocker: this is an intentional, confirmed exit.
                // A ref (not state) because the exit below can navigate synchronously via
                // Alert's redirectUrl effect, which can fire before a state update would have
                // propagated to the blocker's registered predicate (react-router only updates
                // it inside an effect) — see useUnsavedChangesBlocker's isBypassingRef.
                isBypassingRef.current = true;
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
            {showBlockerModal && (
                <SaveChangesAndExitModal
                    heading={blockerModalProps.heading}
                    description={blockerModalProps.description}
                    actionButtonText={blockerModalProps.actionButtonText}
                    secondaryButtonText={blockerModalProps.secondaryButtonText}
                    handleConfirm={blockerModalProps.handleConfirm}
                    handleSecondary={blockerModalProps.handleSecondary}
                    closeModal={blockerModalProps.closeModal}
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
                    type="button"
                    className="usa-button usa-button--unstyled margin-right-2"
                    data-cy="cancel-button"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
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
                    type="button"
                    className="usa-button usa-button--outline margin-top-6 margin-bottom-6"
                    onClick={handleAddProject}
                >
                    Add New Project
                </button>
            </div>
        </>
    );
};

export default StepSelectProject;
