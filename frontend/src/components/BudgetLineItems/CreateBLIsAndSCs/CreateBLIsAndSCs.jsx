import { useEffect, useRef } from "react";
import EditModeTitle from "../../../pages/agreements/EditModeTitle";
import AgreementBudgetLinesHeader from "../../Agreements/AgreementBudgetLinesHeader";
import AgreementTotalCard from "../../Agreements/AgreementDetailsCards/AgreementTotalCard";
import BLIsByFYSummaryCard from "../../Agreements/AgreementDetailsCards/BLIsByFYSummaryCard";
import ProjectAgreementSummaryCard from "../../Projects/ProjectAgreementSummaryCard";
import ServicesComponents from "../../ServicesComponents";
import ServicesComponentAccordion from "../../ServicesComponents/ServicesComponentAccordion";
import GoBackButton from "../../UI/Button/GoBackButton";
import FormHeader from "../../UI/Form/FormHeader";
import ConfirmationModal from "../../UI/Modals/ConfirmationModal";
import SaveChangesAndExitModal from "../../UI/Modals/SaveChangesAndExitModal";
import StepIndicator from "../../UI/StepIndicator/StepIndicator";
import BudgetLinesForm from "../BudgetLinesForm";
import BudgetLinesTable from "../BudgetLinesTable";
import useCreateBLIsAndSCs from "./CreateBLIsAndSCs.hooks";
import { findIfOptional } from "../../../helpers/servicesComponent.helpers";
import { cleanBudgetLineItemForApi } from "../../../helpers/agreement.helpers";
import { useEditAgreement } from "../../Agreements/AgreementEditor/AgreementEditorContext.hooks";

/**
 * Renders the Create Budget Lines and Services Components with React context.
 * @component
 * @param {Object} props - The component props.
 * @param {Function} [props.goToNext] - A function to navigate to the next step in the flow. - optional
 * @param {Function} [props.goBack] - A function to navigate to the previous step in the flow. - optional
 * @param {string[]} props.wizardSteps - An array of objects representing the steps in the flow.
 * @param {number} props.currentStep - The index of the current step in the flow.
 * @param {import("../../../types/ProjectTypes").Project} [props.selectedResearchProject] - The selected research project.
 * @param {import("../../../types/AgreementTypes").Agreement} [props.selectedAgreement] - The selected agreement.
 * @param {import("../../../types/AgreementTypes").ProcurementShop} [props.selectedProcurementShop] - The selected procurement shop.
 * @param {import("../../../types/BudgetLineTypes").BudgetLine[]} props.budgetLines - The selected Agreements budget lines.
 * @param {string} props.continueBtnText - The text to display on the "Continue" button.
 * @param {boolean} props.isEditMode - Whether the form is in edit mode.
 * @param {boolean} [props.canUserEditBudgetLines] - Whether the user can edit budget lines.
 * @param {Function} props.setIsEditMode - A function to set the edit mode state.
 * @param {boolean} props.isReviewMode - Whether the form is in review mode.
 * @param {Function} [props.continueOverRide] - A function to override the default "Continue" button behavior. - optional
 * @param {"agreement" | "none"} props.workflow - The workflow type.
 * @param {boolean} props.includeDrafts - Whether to include drafts budget lines.
 * @param {Function} props.setIncludeDrafts - A function to set the include drafts state.
 * @param {boolean} [props.hideFooterButtons] - Whether to hide the bottom action row (Cancel / Continue / Save Changes). - optional
 * @param {boolean} [props.hideWizardChrome] - Whether to suppress the step indicator, edit-mode title, and project summary card in the agreement workflow. - optional
 * @param {number} [props.saveTrigger] - Increment from a parent to request a batch save. The component runs `handleSave(false, true)` and reports back via `onSaved`. - optional
 * @param {function} [props.onSaved] - Called with `{ ok, error? }` after a `saveTrigger`-driven save attempt completes. - optional
 * @param {function} [props.onValidityChange] - Called with `true` when the budget-lines form is valid (no vest errors and the user is allowed to edit), `false` otherwise. Only meaningful in review mode. - optional
 * @param {React.MutableRefObject<{getSlice: () => object}|null>} [props.bundleSliceRef] - When provided, the component populates `ref.current = { getSlice }`. `getSlice()` returns `{ services_components: { create, update, delete }, budget_line_items: { create, update, delete } }` reflecting the user's current edits, suitable for the agreement edit-bundle endpoint. Used by the review-flow edit page so it can fire one atomic mutation instead of fanning out per-resource calls. - optional
 * @returns {JSX.Element} - The rendered component.
 */
export const CreateBLIsAndSCs = ({
    goToNext,
    goBack,
    wizardSteps,
    currentStep,
    selectedResearchProject = {},
    selectedAgreement = {},
    selectedProcurementShop = {},
    budgetLines = [],
    continueBtnText,
    continueOverRide,
    isEditMode,
    canUserEditBudgetLines = false,
    setIsEditMode = () => {},
    isReviewMode,
    workflow,
    includeDrafts,
    setIncludeDrafts,
    hideFooterButtons = false,
    hideWizardChrome = false,
    saveTrigger,
    onSaved,
    onValidityChange,
    bundleSliceRef
}) => {
    const {
        blocker,
        handleDeleteBudgetLine,
        handleDuplicateBudgetLine,
        handleEditBLI,
        handleResetForm,
        handleSetBudgetLineForEditingById,
        handleAddBLI,
        isEditing,
        modalProps,
        pageErrors,
        setEnteredAmount,
        setEnteredDescription,
        setSelectedCan,
        servicesComponentNumber,
        setShowModal,
        showModal,
        setShowSaveChangesModal,
        selectedCan,
        enteredAmount,
        needByDate,
        setNeedByDate,
        enteredDescription,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        res,
        feesForCards,
        subTotalForCards,
        totalsForCards,
        handleCancel,
        handleGoBack,
        handleSave,
        budgetLinesForCards,
        tempBudgetLines,
        deletedBudgetLines,
        isBudgetLineNotDraft,
        budgetFormSuite,
        datePickerSuite,
        isAgreementNotYetDeveloped,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        setServicesComponentNumber,
        effectiveScStartDate,
        effectiveScEndDate
    } = useCreateBLIsAndSCs(
        isEditMode,
        isReviewMode,
        budgetLines,
        goToNext,
        goBack,
        continueOverRide,
        selectedAgreement,
        selectedProcurementShop,
        setIsEditMode,
        workflow,
        includeDrafts,
        canUserEditBudgetLines,
        continueBtnText,
        currentStep
    );

    const isAgreementWorkflowOrCanEditBudgetLines = workflow === "agreement" || canUserEditBudgetLines;

    const handleSaveRef = useRef(handleSave);
    const onSavedRef = useRef(onSaved);
    useEffect(() => {
        handleSaveRef.current = handleSave;
        onSavedRef.current = onSaved;
    });

    useEffect(() => {
        if (!saveTrigger) return;
        let cancelled = false;
        (async () => {
            try {
                await handleSaveRef.current?.(false, true, true);
                if (!cancelled) onSavedRef.current?.({ ok: true });
            } catch (error) {
                if (!cancelled) onSavedRef.current?.({ ok: false, error });
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [saveTrigger]);

    const isBLIsValid = res.isValid() && isAgreementWorkflowOrCanEditBudgetLines;
    useEffect(() => {
        if (onValidityChange) {
            onValidityChange(isBLIsValid);
        }
    }, [onValidityChange, isBLIsValid]);

    // Bundle slice export. The page (`EditAgreementAndBudgetLines`) reads this synchronously
    // when the user clicks Save Changes and folds it into a single edit-bundle PATCH so that
    // a partial-success failure mode is impossible (one transaction, all or nothing).
    const editorState = useEditAgreement();
    const deletedServicesComponentsIds = editorState?.deleted_services_components_ids ?? [];
    useEffect(() => {
        if (!bundleSliceRef) return;
        bundleSliceRef.current = {
            getSlice: () => {
                // Capture each new SC's ref BEFORE stripping UI-only fields. The ref is used
                // by new BLIs to link to a not-yet-persisted SC via `services_component_ref`.
                const newScsRaw = servicesComponents.filter((sc) => !("created_on" in sc));
                const newScs = newScsRaw.map((sc) => {
                    const ref = sc.display_title ?? String(sc.number ?? "");
                    // eslint-disable-next-line no-unused-vars
                    const { display_title, has_changed, popStartDate, popEndDate, mode, ...clean } = sc;
                    return { ...clean, ref };
                });
                const changedScs = servicesComponents
                    .filter((sc) => "created_on" in sc && sc.has_changed)
                    .map((sc) => {
                        // eslint-disable-next-line no-unused-vars
                        const { display_title, has_changed, popStartDate, popEndDate, mode, ...clean } = sc;
                        return { id: sc.id, ...clean };
                    });

                // For BLIs we need to resolve the SC link. New BLIs carry only
                // `services_component_number`; the link is either:
                //   - an existing persisted SC (use services_component_id directly), or
                //   - a new SC in the same bundle (use services_component_ref).
                const existingScByNumber = new Map(
                    servicesComponents.filter((sc) => "created_on" in sc).map((sc) => [sc.number, sc])
                );
                const newScByNumber = new Map(newScs.map((sc) => [sc.number, sc]));

                const linkBliToSc = (bli) => {
                    if (bli.services_component_number == null) return {};
                    const existingSc = existingScByNumber.get(bli.services_component_number);
                    if (existingSc) {
                        return { services_component_id: existingSc.id };
                    }
                    const newSc = newScByNumber.get(bli.services_component_number);
                    if (newSc) {
                        return { services_component_ref: newSc.ref };
                    }
                    return {};
                };

                // Apply the SC link last so it wins over whatever services_component_id
                // was present on the cleaned payload — for an existing BLI reassigned to
                // a not-yet-persisted (in-bundle) SC, we must drop the stale id and emit
                // services_component_ref instead.
                const applyScLink = (cleaned, link) => {
                    const out = { ...cleaned, ...link };
                    if ("services_component_ref" in link) {
                        delete out.services_component_id;
                    }
                    return out;
                };

                const newBlis = tempBudgetLines
                    .filter((bli) => !("created_on" in bli))
                    .map((bli) => {
                        const link = linkBliToSc(bli);
                        const { data: cleaned } = cleanBudgetLineItemForApi(bli);
                        return applyScLink(cleaned, link);
                    });

                // For the dirty check we compare cleaned-vs-cleaned so the UI-only
                // decorations (services_component_number, serviceComponentGroupingLabel,
                // fees, _meta, etc.) don't make every existing BLI look "changed".
                // Apply linkBliToSc to updates as well so an existing BLI moved onto an
                // in-bundle (newly-created) SC carries services_component_ref.
                const updatedBlis = tempBudgetLines
                    .filter((bli) => "created_on" in bli)
                    .map((bli) => {
                        const baseline = budgetLines.find((b) => b.id === bli.id);
                        const link = linkBliToSc(bli);
                        const { id, data: cleaned } = cleanBudgetLineItemForApi(bli);
                        if (baseline) {
                            const { data: cleanedBaseline } = cleanBudgetLineItemForApi(baseline);
                            if (JSON.stringify(cleaned) === JSON.stringify(cleanedBaseline)) {
                                return null;
                            }
                        }
                        return { id, ...applyScLink(cleaned, link) };
                    })
                    .filter(Boolean);

                return {
                    services_components: {
                        create: newScs,
                        update: changedScs,
                        delete: deletedServicesComponentsIds
                    },
                    budget_line_items: {
                        create: newBlis,
                        update: updatedBlis,
                        delete: (deletedBudgetLines ?? []).map((b) => b.id)
                    }
                };
            }
        };
    });

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

            {blocker.state === "blocked" && (
                <SaveChangesAndExitModal
                    heading={modalProps.heading}
                    setShowModal={setShowSaveChangesModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                    description={modalProps.description}
                    handleSecondary={modalProps.handleSecondary}
                    closeModal={modalProps.closeModal}
                />
            )}

            {workflow === "agreement" && (
                <>
                    {!hideWizardChrome && (
                        <>
                            <EditModeTitle isEditMode={isEditMode || isReviewMode} />
                            <StepIndicator
                                steps={wizardSteps}
                                currentStep={currentStep}
                            />
                            <ProjectAgreementSummaryCard
                                selectedResearchProject={selectedResearchProject}
                                selectedAgreement={selectedAgreement}
                                selectedProcurementShop={selectedProcurementShop}
                            />
                        </>
                    )}
                    {isAgreementWorkflowOrCanEditBudgetLines && (
                        <ServicesComponents
                            serviceRequirementType={selectedAgreement.service_requirement_type ?? ""}
                            agreementId={selectedAgreement.id}
                            continueBtnText={continueBtnText}
                            workflow={workflow}
                            isReviewMode={isReviewMode}
                            setHasUnsavedChanges={setHasUnsavedChanges}
                            hasUnsavedChanges={hasUnsavedChanges}
                        />
                    )}
                    <div className={isReviewMode ? "margin-top-8" : "margin-top-3"}>
                        <FormHeader
                            heading={isReviewMode ? "Edit Budget Lines" : "Add Budget Lines"}
                            details={
                                isReviewMode
                                    ? undefined
                                    : "Add Budget lines to each Services Component to outline how the work will be funded."
                            }
                        />
                    </div>
                    <div className="display-flex flex-justify margin-y-2">
                        <AgreementTotalCard
                            total={totalsForCards(subTotalForCards(tempBudgetLines), tempBudgetLines)}
                            subtotal={subTotalForCards(tempBudgetLines)}
                            fees={feesForCards(tempBudgetLines)}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee_percentage}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={tempBudgetLines} />
                    </div>
                </>
            )}

            {workflow === "none" && (
                // NOTE: this is the Agreement Details page
                <>
                    {!isAgreementNotYetDeveloped && (
                        <ServicesComponents
                            serviceRequirementType={selectedAgreement.service_requirement_type ?? ""}
                            agreementId={selectedAgreement.id}
                            isEditMode={isEditMode}
                            continueBtnText={continueBtnText}
                            setHasUnsavedChanges={setHasUnsavedChanges}
                            hasUnsavedChanges={hasUnsavedChanges}
                        />
                    )}
                    <AgreementBudgetLinesHeader
                        heading="Edit Budget Lines"
                        includeDrafts={includeDrafts}
                        setIncludeDrafts={setIncludeDrafts}
                        isEditable={false}
                    />
                    <div className="display-flex flex-justify margin-y-2">
                        <AgreementTotalCard
                            total={totalsForCards(subTotalForCards(budgetLinesForCards), budgetLinesForCards)}
                            subtotal={subTotalForCards(budgetLinesForCards)}
                            fees={feesForCards(budgetLinesForCards)}
                            procurementShopAbbr={selectedProcurementShop?.abbr}
                            procurementShopFee={selectedProcurementShop?.fee_percentage}
                        />
                        <BLIsByFYSummaryCard budgetLineItems={budgetLinesForCards} />
                    </div>
                </>
            )}

            {isAgreementWorkflowOrCanEditBudgetLines && (
                <BudgetLinesForm
                    selectedCan={selectedCan}
                    servicesComponentNumber={servicesComponentNumber}
                    enteredAmount={enteredAmount}
                    needByDate={needByDate}
                    setNeedByDate={setNeedByDate}
                    enteredDescription={enteredDescription}
                    isEditing={isEditing}
                    setServicesComponentNumber={setServicesComponentNumber}
                    setSelectedCan={setSelectedCan}
                    setEnteredAmount={setEnteredAmount}
                    setEnteredDescription={setEnteredDescription}
                    handleEditBLI={handleEditBLI}
                    handleResetForm={handleResetForm}
                    handleAddBLI={handleAddBLI}
                    isReviewMode={isReviewMode}
                    isEditMode={isEditMode}
                    agreementId={selectedAgreement.id}
                    isBudgetLineNotDraft={isBudgetLineNotDraft}
                    budgetFormSuite={budgetFormSuite}
                    datePickerSuite={datePickerSuite}
                    hasUnsavedChanges={hasUnsavedChanges}
                    workflow={workflow}
                    scStartDate={effectiveScStartDate}
                    scEndDate={effectiveScEndDate}
                />
            )}

            {pageErrors?.length > 0 && (
                <div className="font-12px usa-form-group usa-form-group--error margin-left-0 margin-bottom-2">
                    <span
                        className="usa-error-message text-normal margin-left-neg-1"
                        role="alert"
                    >
                        This information is required to submit for approval
                    </span>
                </div>
            )}

            {groupedBudgetLinesByServicesComponent.length > 0 ? (
                groupedBudgetLinesByServicesComponent.map((group, index) => {
                    const budgetLineScGroupingLabel = group.serviceComponentGroupingLabel
                        ? group.serviceComponentGroupingLabel
                        : group.servicesComponentNumber;
                    return (
                        <ServicesComponentAccordion
                            key={`${group.servicesComponentNumber}-${index}`}
                            servicesComponentNumber={group.servicesComponentNumber}
                            serviceComponentGroupingLabel={group.serviceComponentGroupingLabel}
                            serviceRequirementType={selectedAgreement.service_requirement_type}
                            optional={findIfOptional(servicesComponents, budgetLineScGroupingLabel)}
                        >
                            <BudgetLinesTable
                                budgetLines={group.budgetLines}
                                handleSetBudgetLineForEditing={handleSetBudgetLineForEditingById}
                                handleDeleteBudgetLine={handleDeleteBudgetLine}
                                handleDuplicateBudgetLine={handleDuplicateBudgetLine}
                                isEditable={isAgreementWorkflowOrCanEditBudgetLines}
                                isReviewMode={isReviewMode}
                            />
                        </ServicesComponentAccordion>
                    );
                })
            ) : (
                <p className="text-center margin-y-7">You have not added any Budget Lines yet.</p>
            )}
            {!hideFooterButtons && (
                <div className="display-flex flex-justify margin-top-1">
                    {workflow === "agreement" && <GoBackButton handleGoBack={handleGoBack} />}
                    <div className={workflow === "agreement" ? "" : "margin-left-auto"}>
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
                            className="usa-button"
                            data-cy="continue-btn"
                            onClick={() => {
                                handleSave(false);
                            }}
                            disabled={(isReviewMode && !res.isValid()) || !isAgreementWorkflowOrCanEditBudgetLines}
                        >
                            {isReviewMode ? "Save Changes" : continueBtnText}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreateBLIsAndSCs;
