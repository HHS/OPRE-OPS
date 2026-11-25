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
    locksServicesComponentNumbers = false
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
        formKey
    } = useServicesComponents(
        agreementId,
        serviceRequirementType,
        continueBtnText,
        setHasUnsavedChanges,
        scFormSuite,
        nonDraftBudgetLines,
        allBudgetLines
    );

    // Leaving edit mode (Update or Cancel) swaps the focused button for "Add Services Component",
    // and a confirmed delete removes the item that had focus, so keyboard focus would drop to
    // <body> (WCAG 2.4.3). When that happens, put it on the Add button instead. An empty SC now
    // deletes with no modal at all (OPS-3268 AC1), so a shrinking list is its own trigger too.
    const addButtonRef = React.useRef(/** @type {HTMLButtonElement | null} */ (null));
    const previous = React.useRef({ mode: formData.mode, showModal, scCount: servicesComponents.length });
    React.useEffect(() => {
        const leftEditMode = previous.current.mode === "edit" && formData.mode !== "edit";
        const closedModal = previous.current.showModal && !showModal;
        const deletedAnSc = servicesComponents.length < previous.current.scCount;
        previous.current = { mode: formData.mode, showModal, scCount: servicesComponents.length };
        if (!leftEditMode && !closedModal && !deletedAnSc) return;
        const focusLost = !document.activeElement || document.activeElement === document.body;
        if (focusLost) addButtonRef.current?.focus();
    }, [formData.mode, showModal, servicesComponents.length]);

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
