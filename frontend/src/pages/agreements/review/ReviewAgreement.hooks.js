import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetServicesComponentsListQuery,
    useUpdateBudgetLineItemMutation
} from "../../../api/opsAPI";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import useAlert from "../../../hooks/use-alert.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { actionOptions, selectedAction } from "./ReviewAgreement.constants";
import { anyBudgetLinesByStatus, getSelectedBudgetLines } from "./ReviewAgreement.helpers";
import agreementSuite, { validateBudgetLineItems } from "./suite";

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

    const [afterApproval, setAfterApproval] = useToggle(true);
    const [updateBudgetLineItem] = useUpdateBudgetLineItemMutation();
    const { setAlert } = useAlert();
    const navigate = useNavigate();

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

    const groupedBudgetLinesByServicesComponent = budgetLines
        ? groupByServicesComponent(budgetLines, servicesComponents)
        : [];

    // NOTE: convert page errors about budget lines object into an array of objects
    const anyBudgetLinesDraft = anyBudgetLinesByStatus(agreement ?? {}, "DRAFT");
    const anyBudgetLinePlanned = anyBudgetLinesByStatus(agreement ?? {}, "PLANNED");
    const actionOptionsToChangeRequests = {
        [actionOptions.CHANGE_DRAFT_TO_PLANNED]: selectedAction.DRAFT_TO_PLANNED,
        [actionOptions.CHANGE_PLANNED_TO_EXECUTING]: selectedAction.PLANNED_TO_EXECUTING
    };
    let changeRequestAction = actionOptionsToChangeRequests[action];
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
        if (selectedBudgetLines.length === 0) {
            return null;
        }
        return agreementSuite.get();
    }, [selectedBudgetLines.length, agreement]);

    const bliValidationResults = React.useMemo(() => {
        if (!selectedBudgetLines || selectedBudgetLines.length === 0) {
            return [];
        }
        return validateBudgetLineItems(selectedBudgetLines);
    }, [selectedBudgetLines]);

    const hasBLIError = React.useMemo(() => {
        if (!bliValidationResults || bliValidationResults.length === 0) {
            return false;
        }
        return bliValidationResults.some(({ isValid }) => !isValid);
    }, [bliValidationResults]);

    let changeTo = {};
    if (action === actionOptions.CHANGE_DRAFT_TO_PLANNED) {
        changeTo = {
            status: {
                new: BLI_STATUS.PLANNED,
                old: BLI_STATUS.DRAFT
            }
        };
    } else {
        changeTo = {
            status: {
                new: BLI_STATUS.EXECUTING,
                old: BLI_STATUS.PLANNED
            }
        };
    }

    const isAgreementAwarded = agreement?.is_awarded;

    React.useEffect(() => {
        // Add guard clause
        if (!agreement?.budget_line_items || !servicesComponents) {
            return;
        }

        let newBudgetLines =
            (agreement?.budget_line_items && agreement.budget_line_items.length > 0
                ? agreement.budget_line_items
                : null) ?? [];

        newBudgetLines = newBudgetLines.map((bli) => {
            const budgetLineServicesComponent = servicesComponents?.find((sc) => sc.id === bli.services_component_id);
            const serviceComponentNumber = budgetLineServicesComponent?.number ?? 0;
            const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                ? `${serviceComponentNumber}-${budgetLineServicesComponent?.sub_component}`
                : `${serviceComponentNumber}`;
            return {
                ...bli,
                services_component_number: serviceComponentNumber,
                serviceComponentGroupingLabel,
                selected: false, // for use in the BLI table
                actionable: false // based on action accordion
            };
        });

        setBudgetLines(newBudgetLines);
    }, [agreement, servicesComponents]);

    React.useEffect(() => {
        if (isSuccess) {
            agreementSuite({
                ...agreement
            });
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
            bliValidationResults.forEach(({ isValid, errors }) => {
                if (isValid) {
                    return;
                }
                Object.entries(errors).forEach(([fieldName, messages]) => {
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
                if (bli.actionable && bli.services_component_number === servicesComponentNumber) {
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

    return {
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
