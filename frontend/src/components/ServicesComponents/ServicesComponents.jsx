import React from "react";
import ConfirmationModal from "../UI/Modals/ConfirmationModal";
import ServicesComponentForm from "./ServicesComponentForm";
import useServicesComponents from "./ServicesComponents.hooks";
import ServicesComponentsList from "./ServicesComponentsList";

/**
 * ServicesComponents is a component that handles the display and functionality of service components.
 *
 * @component
 * @param {object} props
 * @param { 'NON_SEVERABLE' | 'SEVERABLE'} props.serviceRequirementType - The type of service requirement.
 * @param {number} props.agreementId - The ID of the agreement.
 * @param {boolean} [props.isEditMode] - Whether the component is in edit mode.
 * @param {boolean} [props.isReviewMode] - Whether the component is in review mode (single-page edit screen).
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @param {import('vest').Suite<any, any>} [props.scFormSuite] - Vest validation suite for the SC form.
 * @param {import('../../../types/BudgetLineTypes').BudgetLine[]} [props.nonDraftBudgetLines] - Non-draft BLIs used by the SC form suite for PoP validation.
 * @param {import('../../../types/BudgetLineTypes').BudgetLine[]} [props.allBudgetLines] - Every BLI on the agreement (including Draft), used to decide delete behavior for an SC's own budget lines (OPS-3268).
 * @param {boolean} [props.locksServicesComponentNumbers] - Whether a saved SC's number and Optional flag are locked (Awarded agreement, OPS-3268).
 * @param {boolean} [props.isSuperUser] - Whether the acting user is a super user (OPS-3268: affects whether deleting a Planned/Executing budget line is immediate or approval-routed).
 * @param {boolean} [props.tracksContractModifications] - Whether the agreement is Awarded and tracked (OPS-3072/OPS-3268): also makes that deletion immediate.
 * @returns {React.ReactElement}
 *
 * @example
 *  <ServicesComponents serviceRequirementType="SEVERABLE" agreementId={123} />
 */
const ServicesComponents = ({
    serviceRequirementType,
    agreementId,
    isEditMode = false,
    isReviewMode = false,
    continueBtnText,
    workflow,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    scFormSuite,
    nonDraftBudgetLines = [],
    allBudgetLines = [],
    locksServicesComponentNumbers = false,
    isSuperUser = false,
    tracksContractModifications = false
}) => {
    const {
        formData,
        modalProps,
        servicesComponents,
        setFormData,
        setShowModal,
        showModal,
        handleSubmit,
        handleDelete,
        handleCancel,
        setFormDataById,
        servicesComponentsNumbers,
        formKey,
        deleteCount
    } = useServicesComponents(
        agreementId,
        serviceRequirementType,
        continueBtnText,
        setHasUnsavedChanges,
        scFormSuite,
        nonDraftBudgetLines,
        allBudgetLines,
        isSuperUser,
        tracksContractModifications
    );

    // Leaving edit mode (Update or Cancel) swaps the focused button for "Add Services Component",
    // and a confirmed delete removes the item that had focus, so keyboard focus would drop to
    // <body> (WCAG 2.4.3). When that happens, put it on the Add button instead. An empty SC now
    // deletes with no modal at all (OPS-3268 AC1), so deleteCount (bumped only when performDelete
    // actually runs) is its own trigger too. This deliberately does NOT key off
    // servicesComponents.length: that array can also shrink for unrelated reasons (e.g. a save
    // failure reseeding it back to the server's shorter list), which must not steal focus away
    // from whatever the user was doing -- often the error alert from that same failed save.
    const addButtonRef = React.useRef(/** @type {HTMLButtonElement | null} */ (null));
    const previous = React.useRef({ mode: formData.mode, showModal, deleteCount });
    React.useEffect(() => {
        const leftEditMode = previous.current.mode === "edit" && formData.mode !== "edit";
        const closedModal = previous.current.showModal && !showModal;
        const deletedAnSc = deleteCount > previous.current.deleteCount;
        previous.current = { mode: formData.mode, showModal, deleteCount };
        if (!leftEditMode && !closedModal && !deletedAnSc) return;
        const focusLost = !document.activeElement || document.activeElement === document.body;
        if (focusLost) addButtonRef.current?.focus();
    }, [formData.mode, showModal, deleteCount]);

    return (
        <>
            {showModal && (
                <ConfirmationModal
                    heading={modalProps.heading}
                    description={modalProps.description}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    tertiaryButtonText={modalProps.tertiaryButtonText}
                    handleTertiary={modalProps.handleTertiary}
                />
            )}

            <ServicesComponentForm
                serviceTypeReq={serviceRequirementType}
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSubmit}
                handleCancel={handleCancel}
                servicesComponentsNumbers={servicesComponentsNumbers}
                isEditMode={isEditMode}
                isReviewMode={isReviewMode}
                formKey={formKey}
                hasUnsavedChanges={hasUnsavedChanges}
                workflow={workflow}
                scFormSuite={scFormSuite}
                locksServicesComponentNumbers={locksServicesComponentNumbers}
                addButtonRef={addButtonRef}
            />

            <ServicesComponentsList
                servicesComponents={servicesComponents}
                setFormDataById={setFormDataById}
                handleDelete={handleDelete}
                allBudgetLines={allBudgetLines}
            />
        </>
    );
};

export default ServicesComponents;
