import React from "react";
import { useBlocker, useNavigate } from "react-router-dom";
import { useDeleteAgreementMutation, useGetAllProjectsQuery } from "../../api/opsAPI";
import {
    useEditAgreement,
    useSetState,
    useUpdateAgreement
} from "../../components/Agreements/AgreementEditor/AgreementEditorContext.hooks";
import ProjectSelectWithSummaryCard from "../../components/Projects/ProjectSelectWithSummaryCard";
import ConfirmationModal from "../../components/UI/Modals/ConfirmationModal";
import StepIndicator from "../../components/UI/StepIndicator/StepIndicator";
import useAlert from "../../hooks/use-alert.hooks";
import useHasStateChanged from "../../hooks/useHasStateChanged.hooks";
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

    // Bypass ref (not state): a confirmed Cancel can navigate synchronously via Alert's
    // redirectUrl effect, before a state update would have propagated to the blocker's
    // registered predicate (react-router only re-registers it inside an effect).
    const isBypassingRef = React.useRef(false);
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            !isBypassingRef.current &&
            hasProjectChanged &&
            // Suppress while the Cancel dialog is already open, so browser Back can't
            // re-trigger it on top of itself.
            !showModal &&
            currentLocation.pathname !== nextLocation.pathname
    );
    const blockerRef = React.useRef(blocker);
    React.useEffect(() => {
        blockerRef.current = blocker;
    }, [blocker]);

    // Closes the Cancel confirmation (whichever trigger opened it — the Cancel button or
    // the browser-Back guard below) and discards any pending blocked back-navigation so the
    // user stays on the page instead of leaving a blocked transition dangling.
    const handleCloseModal = (value) => {
        setShowModal(value);
        if (!value && blockerRef.current.state === "blocked") {
            blockerRef.current.reset();
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
                // handleCloseModal already reset any blocked back-navigation; this also keeps
                // the redirect below (fired via Alert's redirectUrl effect) from being blocked
                // again, since react-router only re-registers the predicate inside an effect.
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

    // Browser Back with an unsaved project selection opens the same Cancel confirmation as
    // the page's Cancel button, rather than a separate "leave without saving" modal —
    // confirming cancels the agreement (same as Cancel) instead of resuming navigation to
    // wherever Back was headed.
    React.useEffect(() => {
        if (blocker.state === "blocked") {
            handleCancel();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocker.state]);

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

    const handleAddProject = () => {
        navigate("/projects/create");
    };

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    setShowModal={handleCloseModal}
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
