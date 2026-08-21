import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetGrantNumbersListQuery,
    useGetServicesComponentsListQuery,
    useGetVersionQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import { AgreementType } from "../agreements.constants";
import { BLI_STATUS, groupByGrantNumber, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import useAlert from "../../../hooks/use-alert.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { actionOptions, selectedAction } from "./ReviewAgreement.constants";
import { anyBudgetLinesByStatus, getSelectedBudgetLines } from "./ReviewAgreement.helpers";
import agreementSuite, { POP_RANGE_ERROR_KEY, validateBudgetLineItems } from "./suite";

/**
 * Custom hook for the Review Agreement page
 * @param {number} agreementId - the agreement ID
 */
const useReviewAgreement = (agreementId) => {
    const [action, setAction] = React.useState(""); // for the action accordion
    const [budgetLines, setBudgetLines] = React.useState([]);
    const [pageErrors, setPageErrors] = React.useState({});
    const [isAlertActive, setIsAlertActive] = React.useState(false);
    const [notes, setNotes] = React.useState("");
    const [toggleStates, setToggleStates] = React.useState({});
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    const [suiteResult, setSuiteResult] = React.useState(null);

    const [afterApproval, setAfterApproval] = useToggle(true);
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const { setAlert } = useAlert();
    const navigate = useNavigate();

    // Per-environment capability: when ON, Draft→Planned status changes apply immediately
    // (no Change Request). Default to false (safe = "Send to Approval") until the query
    // resolves so the action button never over-promises immediate apply. The backend is the
    // enforcement authority; this flag only drives display/copy.
    const { data: versionData } = useGetVersionQuery();
    const skipCrForDraftPlanned = versionData?.skip_cr_for_draft_planned ?? false;

    const {
        isSuccess,
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id, { skip: !agreement });
    const { data: grantNumbers } = useGetGrantNumbersListQuery(agreement?.id, { skip: !agreement });
    const isGrant = agreement?.agreement_type === AgreementType.GRANT;

    const groupedBudgetLinesByServicesComponent = !budgetLines
        ? []
        : isGrant
          ? groupByGrantNumber(budgetLines, grantNumbers ?? [])
          : groupByServicesComponent(budgetLines, servicesComponents);

    // NOTE: convert page errors about budget lines object into an array of objects
    const anyBudgetLinesDraft = anyBudgetLinesByStatus(agreement ?? {}, "DRAFT");
    const anyBudgetLinePlanned = anyBudgetLinesByStatus(agreement ?? {}, "PLANNED");
    const actionOptionsToChangeRequests = {
        [actionOptions.CHANGE_DRAFT_TO_PLANNED]: selectedAction.DRAFT_TO_PLANNED,
        [actionOptions.CHANGE_PLANNED_TO_EXECUTING]: selectedAction.PLANNED_TO_EXECUTING
    };
    let changeRequestAction = actionOptionsToChangeRequests[action];
    // Draft→Planned applies immediately only when the capability is ON. Planned→Executing
    // always requires approval, so it is never treated as applied-immediately.
    const isDraftToPlannedAction = action === actionOptions.CHANGE_DRAFT_TO_PLANNED;
    const appliesImmediately = skipCrForDraftPlanned && isDraftToPlannedAction;
    const isAnythingSelected = getSelectedBudgetLines(budgetLines).length > 0;
    const isDRAFTSubmissionReady =
        anyBudgetLinesDraft && action === actionOptions.CHANGE_DRAFT_TO_PLANNED && isAnythingSelected;
    const isPLANNEDSubmissionReady =
        anyBudgetLinePlanned && action === actionOptions.CHANGE_PLANNED_TO_EXECUTING && isAnythingSelected;
    const isSubmissionReady = isDRAFTSubmissionReady || isPLANNEDSubmissionReady;
    const canUserEditAgreement = agreement?._meta.isEditable;
    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    const selectedBudgetLines = React.useMemo(() => {
        return getSelectedBudgetLines(budgetLines);
    }, [budgetLines]);

    const agreementValidationResults = React.useMemo(() => {
        // Bypass agreement-field validation for grants (OPS-6013) so a grant BL status change can
        // proceed without the contract-oriented required-field checks. Returning null makes the
        // "Send to Approval" gate and the error banner treat the agreement as valid.
        if (isGrant) {
            return null;
        }
        if (selectedBudgetLines.length === 0) {
            return null;
        }
        return suiteResult;
    }, [isGrant, selectedBudgetLines.length, suiteResult]);

    const bliValidationResults = React.useMemo(() => {
        // Grant BLI validation is intentionally skipped on the review/send-to-approval page.
        // The suite's grant_number_id check would gate every DRAFT→PLANNED status change for
        // BLIs not yet linked to a grant number, but linking is not a prerequisite for DRAFT
        // status changes. The backend enforces required-field rules per transition; the frontend
        // validator is optimized for contract agreements (SC, procurement shop) and does not
        // have an equivalent grant-specific model yet.
        if (isGrant) {
            return [];
        }
        if (!selectedBudgetLines || selectedBudgetLines.length === 0) {
            return [];
        }
        return validateBudgetLineItems(selectedBudgetLines);
    }, [isGrant, selectedBudgetLines]);

    const hasBLIError = React.useMemo(() => {
        if (!bliValidationResults || bliValidationResults.length === 0) {
            return false;
        }
        return bliValidationResults.some(({ isValid }) => !isValid);
    }, [bliValidationResults]);

    const changeTo =
        action === actionOptions.CHANGE_DRAFT_TO_PLANNED
            ? {
                  status: {
                      new: BLI_STATUS.PLANNED,
                      old: BLI_STATUS.DRAFT
                  }
              }
            : {
                  status: {
                      new: BLI_STATUS.EXECUTING,
                      old: BLI_STATUS.PLANNED
                  }
              };

    const isAgreementAwarded = agreement?.is_awarded;

    React.useEffect(() => {
        // Add guard clause — grants have no services components, so gate only on the required list per type.
        if (!agreement?.budget_line_items || (isGrant ? !grantNumbers : !servicesComponents)) {
            return;
        }

        let newBudgetLines =
            (agreement?.budget_line_items && agreement.budget_line_items.length > 0
                ? agreement.budget_line_items
                : null) ?? [];

        newBudgetLines = newBudgetLines.map((bli) => {
            if (isGrant) {
                const budgetLineGrantNumber = grantNumbers?.find((gn) => gn.id === bli.grant_number_id);
                const grantNumberNumber = budgetLineGrantNumber?.number ?? 0;
                return {
                    ...bli,
                    grant_number_number: grantNumberNumber,
                    selected: false, // for use in the BLI table
                    actionable: false // based on action accordion
                };
            }
            const budgetLineServicesComponent = servicesComponents?.find((sc) => sc.id === bli.services_component_id);
            const serviceComponentNumber = budgetLineServicesComponent?.number ?? 0;
            const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                ? `${serviceComponentNumber}-${budgetLineServicesComponent?.sub_component}`
                : `${serviceComponentNumber}`;
            return {
                ...bli,
                services_component_number: serviceComponentNumber,
                serviceComponentGroupingLabel,
                // The BL's own SC period, used to validate date_needed falls within the agreement's PoP window
                sc_period_start: budgetLineServicesComponent?.period_start ?? null,
                sc_period_end: budgetLineServicesComponent?.period_end ?? null,
                selected: false, // for use in the BLI table
                actionable: false // based on action accordion
            };
        });

        setBudgetLines(newBudgetLines);
    }, [agreement, servicesComponents, grantNumbers, isGrant]);

    React.useEffect(() => {
        if (isSuccess) {
            const result = agreementSuite.run({
                ...agreement
            });
            setSuiteResult(result);
        }
        return () => {
            agreementSuite.reset();
        };
    }, [isSuccess, agreement]);

    React.useEffect(() => {
        if (!isSuccess || selectedBudgetLines.length === 0) {
            setPageErrors((prev) => {
                if (Object.keys(prev).length === 0) {
                    // Optimization to avoid unnecessary state updates
                    return prev;
                }
                return {};
            });
            setIsAlertActive((prev) => (prev ? false : prev));
            return;
        }

        const aggregatedErrors = {};

        if (agreementValidationResults && !agreementValidationResults.isValid()) {
            const errors = { ...agreementValidationResults.getErrors() };
            if (
                (agreement.agreement_type === "CONTRACT" || agreement.agreement_type === "IAA") &&
                Object.prototype.hasOwnProperty.call(errors, "project-officer")
            ) {
                const corError = errors["project-officer"];
                errors["cor"] = corError;
                delete errors["project-officer"];
            }
            Object.assign(aggregatedErrors, errors);
        }

        if (hasBLIError && Array.isArray(bliValidationResults)) {
            const seenBudgetLineErrors = new Set();
            // Sort by ascending BL id so POP_RANGE_ERROR_KEY messages read in a stable,
            // predictable order regardless of the order BLs were selected in.
            const sortedBliValidationResults = [...bliValidationResults].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
            sortedBliValidationResults.forEach(({ isValid, errors }) => {
                if (isValid) {
                    return;
                }
                Object.entries(errors).forEach(([fieldName, messages]) => {
                    // POP_RANGE_ERROR_KEY shows one alert line per violating BL, so accumulate
                    // every BL's messages instead of deduping to the first (as other keys do).
                    if (fieldName === POP_RANGE_ERROR_KEY) {
                        aggregatedErrors[fieldName] = [...(aggregatedErrors[fieldName] ?? []), ...messages];
                        return;
                    }
                    const errorKey = `${fieldName}`;
                    if (seenBudgetLineErrors.has(errorKey)) {
                        return;
                    }
                    seenBudgetLineErrors.add(errorKey);
                    aggregatedErrors[errorKey] = messages;
                });
            });
        }

        if (Object.keys(aggregatedErrors).length > 0) {
            setIsAlertActive(true);
            setPageErrors(aggregatedErrors);
        } else {
            setPageErrors({});
            setIsAlertActive(false);
        }
    }, [agreementValidationResults, isSuccess, agreement, hasBLIError, bliValidationResults, selectedBudgetLines]);

    /**
     * Create the status change messages for the selected budget lines
     * @param {Object[]} selectedBudgetLines - the selected budget lines
     * @param {typeof actionOptions.CHANGE_DRAFT_TO_PLANNED | typeof actionOptions.CHANGE_PLANNED_TO_EXECUTING } action - the selected action
     */
    const createStatusChangeMessages = (selectedBudgetLines, action) => {
        const statusMessage =
            action === actionOptions.CHANGE_DRAFT_TO_PLANNED ? "Draft to Planned" : "Planned to Executing";

        const messages = selectedBudgetLines.map((bli) => `\u2022 BL ${bli.id} Status: ${statusMessage}`).join("\n");
        return messages;
    };
    const statusChangeMessages = createStatusChangeMessages(selectedBudgetLines, action);
    /**
     * Handle the sending of the budget line items to approval
     * @returns {void}
     */
    const handleSendToApproval = () => {
        if (anyBudgetLinesDraft || anyBudgetLinePlanned) {
            let selectedBLIsWithStatusAndNotes = [];

            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return { id: bli.id, status: BLI_STATUS.PLANNED, requestor_notes: notes };
                    });
                    break;
                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    selectedBLIsWithStatusAndNotes = selectedBudgetLines.map((bli) => {
                        return {
                            id: bli.id,
                            status: BLI_STATUS.EXECUTING,
                            requestor_notes: notes
                        };
                    });
                    break;
                default:
                    break;
            }

            let promises = selectedBLIsWithStatusAndNotes.map((budgetLine) => {
                const { id, data: cleanExistingBLI } = cleanBudgetLineItemForApi(budgetLine);
                return updateBudgetLineItem({ id, data: cleanExistingBLI })
                    .unwrap()
                    .then((fulfilled) => {
                        console.log("Updated BLI:", fulfilled);
                    })
                    .catch((rejected) => {
                        console.error("Error Updating Budget Line");
                        console.error({ rejected });
                        throw new Error("Error Updating Budget Line");
                    });
            });
            Promise.allSettled(promises).then((results) => {
                let rejected = results.filter((result) => result.status === "rejected");
                if (rejected.length > 0) {
                    console.error(rejected[0].reason);
                    setAlert({
                        type: "error",
                        heading: "Error Sending Agreement Edits",
                        message: "There was an error sending your edits for approval. Please try again.",
                        redirectUrl: "/error"
                    });
                } else if (appliesImmediately) {
                    // Capability ON + Draft→Planned: the backend applied the change directly,
                    // no Division Director review. Reflect that in the copy so the user isn't
                    // told review is pending when it isn't.
                    setAlert({
                        type: "success",
                        heading: "Agreement Updated",
                        message: `The agreement ${agreement?.name} has been successfully updated.`,
                        redirectUrl: "/agreements"
                    });
                } else {
                    setAlert({
                        type: "success",
                        heading: "Changes Sent to Approval",
                        message:
                            `Your changes have been successfully sent to your Division Director to review. Once approved, they will update on the agreement.\n\n` +
                            `<strong>Pending Changes:</strong>\n` +
                            `${statusChangeMessages}\n\n` +
                            `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`,

                        redirectUrl: "/agreements"
                    });
                }
            });
        }
    };
    /**
     * Handle the selection of a budget line item
     * @param {number} bliId - the budget line item ID
     * @returns {void}
     */
    const handleSelectBLI = (bliId) => {
        const newBudgetLines = budgetLines.map((bli) => {
            if (+bli.id === +bliId) {
                return {
                    ...bli,
                    selected: !bli.selected
                };
            }
            return bli;
        });

        setBudgetLines(newBudgetLines);
    };
    /**
     * Handle the change of the action accordion
     * @param {string} action - the selected action
     * @returns {void}
     */
    const handleActionChange = (action) => {
        setAction(action);
        setToggleStates({});
        setNotes("");

        const newBudgetLines = budgetLines.map((bli) => {
            switch (action) {
                case actionOptions.CHANGE_DRAFT_TO_PLANNED:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.DRAFT && !bli.in_review
                    };

                case actionOptions.CHANGE_PLANNED_TO_EXECUTING:
                    return {
                        ...bli,
                        selected: false,
                        actionable: bli.status === BLI_STATUS.PLANNED && !bli.in_review
                    };
                default:
                    return bli;
            }
        });

        setBudgetLines(newBudgetLines);
    };
    /**
     * Toggle the selection of actionable budget line items
     * @param {number} servicesComponentNumber - the services component number
     * @returns {void}
     */
    const toggleSelectActionableBLIs = (servicesComponentNumber) => {
        setToggleStates((prevStates) => {
            const newStates = {
                ...prevStates,
                [servicesComponentNumber]: !prevStates[servicesComponentNumber]
            };

            return newStates;
        });

        setBudgetLines((prevBudgetLines) => {
            const updatedLines = prevBudgetLines.map((bli) => {
                // For grants the group key is the grant number; otherwise the services component.
                const bliGroupKey = isGrant ? bli.grant_number_number : bli.services_component_number;
                if (bli.actionable && bliGroupKey === servicesComponentNumber) {
                    return {
                        ...bli,
                        selected: !toggleStates[servicesComponentNumber]
                    };
                }
                return bli;
            });

            return updatedLines;
        });
    };
    /**
     * Handle the cancel of the review process
     * @returns {void}
     */
    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading: "Are you sure you want to cancel this status change? Your changes will not be saved.",
            actionButtonText: "Cancel Status Change",
            secondaryButtonText: "Continue Editing",
            handleConfirm: () => {
                navigate("/agreements");
            }
        });
    };

    /**
     * Clean the budget line item data for the API
     * @param {object} data - the budget line item data
     */
    const cleanBudgetLineItemForApi = (data) => {
        const cleanData = { ...data };
        if (data.services_component_id === 0) {
            cleanData.services_component_id = null;
        }
        if (cleanData.date_needed === "--") {
            cleanData.date_needed = null;
        }
        const budgetLineId = cleanData.id;
        delete cleanData.created_by;
        delete cleanData.created_on;
        delete cleanData.updated_on;
        delete cleanData.can;
        delete cleanData.id;
        delete cleanData.canDisplayName;
        delete cleanData.versions;
        delete cleanData.clin;
        delete cleanData.agreement;
        delete cleanData.financialSnapshotChanged;

        return { id: budgetLineId, data: cleanData };
    };

    // Button label: "Change BL Status" only for a Draft→Planned action when the
    // capability is ON. Everything else (Planned→Executing, or flag OFF) keeps "Send to
    // Approval". Until the version query resolves, fall back to the safe default so the
    // label never flips mid-render.
    const submitButtonText = appliesImmediately ? "Change BL Status" : "Send to Approval";

    return {
        submitButtonText,
        appliesImmediately,
        action,
        handleSelectBLI,
        pageErrors,
        isAlertActive,
        setIsAlertActive,
        agreementValidationResults,
        handleActionChange,
        toggleSelectActionableBLIs,
        notes,
        setNotes,
        servicesComponents,
        grantNumbers,
        isGrant,
        groupedBudgetLinesByServicesComponent,
        handleSendToApproval,
        hasBLIError,
        isAgreementAwarded,
        isSubmissionReady,
        changeRequestAction,
        anyBudgetLinesDraft,
        anyBudgetLinePlanned,
        errorAgreement,
        isLoadingAgreement,
        isAgreementEditable: canUserEditAgreement,
        projectOfficerName,
        alternateProjectOfficerName,
        afterApproval,
        setAfterApproval,
        agreement,
        toggleStates,
        setToggleStates,
        selectedBudgetLines,
        changeTo,
        handleCancel,
        showModal,
        modalProps,
        setShowModal
    };
};

export default useReviewAgreement;
