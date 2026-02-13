import * as React from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetProcurementShopsQuery,
    useGetServicesComponentsListQuery,
    useUpdateChangeRequestMutation
} from "../../../api/opsAPI";
import {
    CHANGE_REQUEST_ACTION,
    CHANGE_REQUEST_SLUG_TYPES
} from "../../../components/ChangeRequests/ChangeRequests.constants";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { getInReviewChangeRequests, titleGenerator } from "../../../helpers/changeRequests.helpers";
import { getAwardingEntityIds } from "../../../helpers/procurementShop.helpers";
import { fromUpperCaseToTitleCase, renderField, toTitleCaseFromSlug } from "../../../helpers/utils";
import useAlert from "../../../hooks/use-alert.hooks.js";
import {
    useChangeRequestsForBudgetLines,
    useChangeRequestsForProcurementShop
} from "../../../hooks/useChangeRequests.hooks";
import { useGetAllCans } from "../../../hooks/useGetAllCans";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { getTotalByCans } from "../review/ReviewAgreement.helpers";

/**
 * @typedef {import('../../../types/ChangeRequestsTypes').ChangeRequest} ChangeRequest
 * @typedef {import('../../../types/BudgetLineTypes').BudgetLine} BudgetLine
 * @typedef {import('../../../types/CANTypes').CAN} CAN
 * @typedef {import('../../../types/CANTypes').BasicCAN} BasicCAN
 * @typedef {import('../../../types/AgreementTypes').Agreement} Agreement
 */

/**
 * @description Custom hook for managing the approval process of an agreement
 */
const useApproveAgreement = () => {
    const { setAlert } = useAlert();
    const urlPathParams = useParams();
    const [reviewCR] = useUpdateChangeRequestMutation();
    const [notes, setNotes] = React.useState("");
    const [confirmation, setConfirmation] = React.useState(false);
    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {}
    });
    // @ts-ignore
    const agreementId = +urlPathParams.id;
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const userId = useSelector((state) => state.auth?.activeUser?.id) ?? null;
    /**
     * @typeof {CHANGE_REQUEST_SLUG_TYPES}
     */
    let changeRequestType = React.useMemo(() => searchParams.get("type") ?? "", [searchParams]);
    /**
     * @typeof {'EXECUTING' | 'PLANNED'}
     */
    let urlChangeToStatus = React.useMemo(() => searchParams.get("to")?.toUpperCase() ?? "", [searchParams]);
    /**
     * @typeof {BLI_STATUS.PLANNED | BLI_STATUS.EXECUTING}
     */
    const statusChangeTo = React.useMemo(
        () => (urlChangeToStatus === "EXECUTING" ? BLI_STATUS.EXECUTING : BLI_STATUS.PLANNED),
        [urlChangeToStatus]
    );

    let checkBoxText;
    switch (changeRequestType) {
        case CHANGE_REQUEST_SLUG_TYPES.BUDGET:
        case CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP:
            checkBoxText = "I understand that approving this budget change will affect my CANs balance(s)";
            break;
        case CHANGE_REQUEST_SLUG_TYPES.STATUS:
            checkBoxText =
                statusChangeTo === BLI_STATUS.PLANNED
                    ? "I understand that approving budget lines for Planned Status will subtract the amounts from the FY budget"
                    : "I understand that approving budget lines for Executing Status will start the Procurement Process";
            break;
        default:
            checkBoxText = "";
            break;
    }
    const [afterApproval, setAfterApproval] = useToggle(true);

    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        isSuccess: isSuccessAgreement
    } = useGetAgreementByIdQuery(agreementId, {
        refetchOnMountOrArgChange: true,
        skip: !agreementId
    });

    const { cans } = useGetAllCans();
    const isAgreementAwarded = agreement?.is_awarded;

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id);
    const { data: procurementShops } = useGetProcurementShopsQuery({});

    const budgetLinesInReview =
        agreement?.budget_line_items?.filter(
            /** @param {BudgetLine} bli */
            (bli) =>
                bli.in_review &&
                (bli.can?.portfolio?.division.division_director_id === userId ||
                    bli.can?.portfolio?.division.deputy_division_director_id === userId)
        ) || [];
    const agreementChangeRequests = agreement?.change_requests_in_review || [];
    const procurementShopChanges = getAwardingEntityIds(agreementChangeRequests ?? []);
    const [{ old: oldAwardingEntityId, new: newAwardingEntityId }] =
        procurementShopChanges.length > 0 ? procurementShopChanges : [{ old: -1, new: -1 }];
    const oldAwardingEntity = procurementShops?.find((shop) => shop.id === oldAwardingEntityId);
    const newAwardingEntity = procurementShops?.find((shop) => shop.id === newAwardingEntityId);
    const budgetLineChangeRequests = agreement?.budget_line_items
        ? getInReviewChangeRequests(agreement.budget_line_items, userId)
        : [];

    /**
     * @type {ChangeRequest[]} changeRequestsInReview
     */
    const changeRequestsInReview = [...agreementChangeRequests, ...budgetLineChangeRequests];
    const changeInCans = getTotalByCans(budgetLinesInReview);

    let statusForTitle = "";

    if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS) {
        statusForTitle = `- ${renderField(null, "status", statusChangeTo)}`;
    }
    const changeRequestTitle = titleGenerator(toTitleCaseFromSlug(changeRequestType));
    const title = `Approval for ${changeRequestTitle} ${statusForTitle}`;

    let requestorNoters = "";
    if (changeRequestType !== CHANGE_REQUEST_SLUG_TYPES.BUDGET) {
        const uniqueNotes = new Set();
        changeRequestsInReview.forEach((changeRequest) => {
            if (changeRequest?.requestor_notes && changeRequest.requested_change_data.status === statusChangeTo) {
                uniqueNotes.add(changeRequest.requestor_notes);
            }
        });
        requestorNoters = Array.from(uniqueNotes)
            .map((note) => `• ${note}`)
            .join("\n");
    }
    // NOTE: 3 types of change requests: budget change, status change to planned, status change to executing
    const budgetChangeRequests = changeRequestsInReview.filter(
        (changeRequest) => changeRequest.has_budget_change || changeRequest.has_proc_shop_change
    );
    const statusChangeRequestsToPlanned = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.PLANNED
    );
    const statusChangeRequestsToExecuting = changeRequestsInReview.filter(
        (changeRequest) =>
            changeRequest.has_status_change && changeRequest.requested_change_data.status === BLI_STATUS.EXECUTING
    );

    const budgetChangeBudgetLines = budgetLinesInReview.filter(
        /** @param {BudgetLine} bli */
        (bli) => bli.change_requests_in_review?.filter((cr) => cr.has_budget_change)
    );
    const budgetChangeMessages = useChangeRequestsForBudgetLines(budgetChangeBudgetLines, null, true);
    const budgetLinesToPlannedMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.PLANNED);
    const budgetLinesToExecutingMessages = useChangeRequestsForBudgetLines(budgetLinesInReview, BLI_STATUS.EXECUTING);
    const procurementShopChangeMessages = useChangeRequestsForProcurementShop(
        agreement,
        oldAwardingEntity,
        newAwardingEntity
    );

    // NOTE: Permission checks
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    const userIsDivisionDirector = userRoles.some((role) => role?.name === "REVIEWER_APPROVER");

    const relevantMessages = React.useMemo(() => {
        if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP) {
            return procurementShopChangeMessages;
        }
        if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET) {
            return budgetChangeMessages;
        }
        if (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS) {
            if (statusChangeTo === BLI_STATUS.PLANNED) {
                return budgetLinesToPlannedMessages;
            }
            if (statusChangeTo === BLI_STATUS.EXECUTING) {
                return budgetLinesToExecutingMessages;
            }
        }
        return [];
    }, [
        changeRequestType,
        statusChangeTo,
        budgetChangeMessages,
        budgetLinesToPlannedMessages,
        budgetLinesToExecutingMessages,
        procurementShopChangeMessages
    ]);
    /**
     * Apply pending changes to budget lines based on the change request type
     * @param {BudgetLine[]} originalBudgetLines - The original budget lines
     * @param {BasicCAN[]} cans - The CAN data retrieved from the RTL Query
     * @param {import("../../../types/AgreementTypes").ProcurementShop|null} newAwardingEntity - new procurement shop
     * @param {import("../../../types/AgreementTypes").ProcurementShop|null} currentAwardingEntity - current procurement shop
     * @param {boolean} isAfterApproval - true for "After Approval" view, false for "Before Approval" view
     * @returns {BudgetLine[]} The updated budget lines
     */
    function applyPendingChangesToBudgetLines(
        originalBudgetLines,
        cans,
        newAwardingEntity = null,
        currentAwardingEntity = null,
        isAfterApproval = false
    ) {
        if (!Array.isArray(originalBudgetLines)) {
            console.error("Expected an array, received:", originalBudgetLines);
            return [];
        }

        return originalBudgetLines.map((budgetLine) => {
            let updatedBudgetLine = { ...budgetLine };

            // For procurement shop change requests, handle fee percentage based on view
            if (
                changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP &&
                !isAfterApproval &&
                currentAwardingEntity
            ) {
                updatedBudgetLine.proc_shop_fee_percentage = (currentAwardingEntity.fee_percentage || 0) / 100;
                updatedBudgetLine.fees = (updatedBudgetLine.amount ?? 0) * updatedBudgetLine.proc_shop_fee_percentage;
            }

            // Check if budget line belongs to approver's division
            const belongsToApproverDivision =
                budgetLine.can?.portfolio.division.division_director_id === userId ||
                budgetLine.can?.portfolio.division.deputy_division_director_id === userId;

            // Only apply changes to budget lines that belong to the approver's division
            if (belongsToApproverDivision && isAfterApproval) {
                // Handle individual budget line and status changes
                if (budgetLine.change_requests_in_review && budgetLine.change_requests_in_review.length > 0) {
                    budgetLine.change_requests_in_review.forEach((changeRequest) => {
                        if (
                            (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET &&
                                changeRequest.has_budget_change) ||
                            (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
                                changeRequest.has_status_change &&
                                changeRequest.requested_change_data.status === statusChangeTo)
                        ) {
                            Object.assign(updatedBudgetLine, changeRequest.requested_change_data);

                            if (changeRequest.requested_change_data.can_id) {
                                const newCan = cans.find(
                                    (can) => can.id === changeRequest.requested_change_data.can_id
                                );
                                if (newCan) {
                                    updatedBudgetLine.can = newCan;
                                } else {
                                    console.warn(
                                        `CAN with id ${changeRequest.requested_change_data.can_id} not found.`
                                    );
                                }
                            }
                        }
                    });
                }

                // Handle procurement shop changes - only for budget lines user can approve (kept for backwards compatibility)
                if (
                    changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP &&
                    isAfterApproval &&
                    newAwardingEntity
                ) {
                    updatedBudgetLine.proc_shop_fee_percentage = (newAwardingEntity.fee_percentage || 0) / 100;
                    updatedBudgetLine.fees =
                        (updatedBudgetLine.amount ?? 0) * updatedBudgetLine.proc_shop_fee_percentage;
                    updatedBudgetLine.total = (updatedBudgetLine.amount ?? 0) + (updatedBudgetLine.fees ?? 0);
                }
            }

            return updatedBudgetLine;
        });
    }

    const {
        groupedBeforeApprovalBudgetLinesByServicesComponent,
        approvedBudgetLinesPreview,
        groupedUpdatedBudgetLinesByServicesComponent
    } =
        isSuccessAgreement && cans
            ? (() => {
                  // For "Before Approval" view - show current state with correct procurement shop fees
                  const beforeApprovalBudgetLines = applyPendingChangesToBudgetLines(
                      agreement?.budget_line_items,
                      cans,
                      newAwardingEntity,
                      agreement?.procurement_shop, // current procurement shop
                      false // isAfterApproval = false
                  );
                  beforeApprovalBudgetLines.forEach((bli) => {
                      const budgetLineServicesComponent = servicesComponents?.find(
                          (sc) => sc.id === bli.services_component_id
                      );
                      const budgetLineScNumber = budgetLineServicesComponent?.number;
                      const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                          ? `${budgetLineScNumber}-${budgetLineServicesComponent?.sub_component}`
                          : `${budgetLineScNumber}`;
                      bli.services_component_number = budgetLineScNumber ?? 0;
                      bli.serviceComponentGroupingLabel = serviceComponentGroupingLabel;
                  });
                  const groupedBeforeApprovalBudgetLinesByServicesComponent = beforeApprovalBudgetLines
                      ? groupByServicesComponent(beforeApprovalBudgetLines, servicesComponents)
                      : [];

                  // For "After Approval" view - show updated state
                  const approvedBudgetLinesPreview = applyPendingChangesToBudgetLines(
                      agreement?.budget_line_items,
                      cans,
                      newAwardingEntity,
                      agreement?.procurement_shop, // current procurement shop
                      true // isAfterApproval = true
                  );
                  approvedBudgetLinesPreview.forEach((bli) => {
                      const budgetLineServicesComponent = servicesComponents?.find(
                          (sc) => sc.id === bli.services_component_id
                      );
                      const budgetLineScNumber = budgetLineServicesComponent?.number;
                      const serviceComponentGroupingLabel = budgetLineServicesComponent?.sub_component
                          ? `${budgetLineScNumber}-${budgetLineServicesComponent?.sub_component}`
                          : `${budgetLineScNumber}`;
                      bli.services_component_number = budgetLineScNumber ?? 0;
                      bli.serviceComponentGroupingLabel = serviceComponentGroupingLabel;
                  });
                  const groupedUpdatedBudgetLinesByServicesComponent = approvedBudgetLinesPreview
                      ? groupByServicesComponent(approvedBudgetLinesPreview, servicesComponents)
                      : [];

                  return {
                      groupedBeforeApprovalBudgetLinesByServicesComponent,
                      approvedBudgetLinesPreview,
                      groupedUpdatedBudgetLinesByServicesComponent
                  };
              })()
            : {
                  groupedBeforeApprovalBudgetLinesByServicesComponent: [],
                  approvedBudgetLinesPreview: [],
                  groupedUpdatedBudgetLinesByServicesComponent: []
              };

    const handleCancel = () => {
        setShowModal(true);
        setModalProps({
            heading:
                "Are you sure you want to cancel? This will exit the review process and you can come back to it later.",
            actionButtonText: "Cancel",
            secondaryButtonText: "Continue Reviewing",
            handleConfirm: () => {
                navigate("/agreements?filter=change-requests");
            }
        });
    };

    /**
     * @param {'APPROVE' | 'REJECT'} action - The action to take (APPROVE or REJECT)
     */
    const handleApproveChangeRequests = (action) => {
        /**
         * @type {ChangeRequest[]}
         */
        let changeRequests = [];
        let heading,
            btnText,
            alertType,
            alertHeading,
            alertMsg = "";

        const BUDGET_APPROVE =
            action === CHANGE_REQUEST_ACTION.APPROVE &&
            (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET ||
                changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP);
        const BUDGET_REJECT =
            action === CHANGE_REQUEST_ACTION.REJECT &&
            (changeRequestType === CHANGE_REQUEST_SLUG_TYPES.BUDGET ||
                changeRequestType === CHANGE_REQUEST_SLUG_TYPES.PROCUREMENT_SHOP);
        const PLANNED_STATUS_APPROVE =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.APPROVE;
        const PLANNED_STATUS_REJECT =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.PLANNED &&
            action === CHANGE_REQUEST_ACTION.REJECT;
        const EXECUTING_STATUS_APPROVE =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.APPROVE;
        const EXECUTING_STATUS_REJECT =
            changeRequestType === CHANGE_REQUEST_SLUG_TYPES.STATUS &&
            statusChangeTo === BLI_STATUS.EXECUTING &&
            action === CHANGE_REQUEST_ACTION.REJECT;

        if (BUDGET_APPROVE) {
            heading = `Are you sure you want to approve this ${changeRequestTitle.toLowerCase()}? The agreement will be updated after your approval.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = budgetChangeRequests;
        }
        if (BUDGET_REJECT) {
            heading = `Are you sure you want to decline this ${changeRequestTitle.toLowerCase()}? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = budgetChangeRequests;
        }
        if (PLANNED_STATUS_APPROVE) {
            heading = `Are you sure you want to approve this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? This will subtract the amounts from the FY budget.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToPlanned;
        }
        if (PLANNED_STATUS_REJECT) {
            heading = `Are you sure you want to decline this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement.\n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToPlanned;
        }
        if (EXECUTING_STATUS_APPROVE) {
            heading = `Are you sure you want to approve this status change to ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? This will start the procurement process.`;
            btnText = "Approve";
            alertType = "success";
            alertHeading = "Changes Approved";
            alertMsg =
                `The following change(s) have been updated on the ${agreement.display_name} agreement. \n\n` +
                `<strong>Changes Approved:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToExecuting;
        }
        if (EXECUTING_STATUS_REJECT) {
            heading = `Are you sure you want to decline these budget lines for ${fromUpperCaseToTitleCase(urlChangeToStatus)} Status? The agreement will remain as it was before the change was requested.`;
            btnText = "Decline";
            alertType = "error";
            alertHeading = "Changes Declined";
            alertMsg =
                `The following change(s) have been declined on the ${agreement.display_name} agreement. \n\n` +
                `<strong>Changes Declined:</strong>\n` +
                `${relevantMessages}\n\n` +
                `${notes ? `<strong>Notes:</strong> ${notes}` : ""}`;
            changeRequests = statusChangeRequestsToExecuting;
        }

        setShowModal(true);
        setModalProps({
            heading,
            actionButtonText: btnText,
            secondaryButtonText: "Cancel",
            handleConfirm: () => {
                let promises = changeRequests.map((changeRequest) => {
                    return reviewCR({
                        change_request_id: changeRequest.id,
                        action,
                        reviewer_notes: notes
                    })
                        .unwrap()
                        .then((fulfilled) => {
                            console.log("Change Request: updated", fulfilled);
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
                            type: alertType,
                            heading: alertHeading,
                            message: alertMsg,
                            redirectUrl: "/agreements?filter=change-requests"
                        });
                    }
                });
            }
        });
    };
    return {
        afterApproval,
        agreement,
        approvedBudgetLinesPreview,
        budgetLinesInReview,
        changeInCans,
        changeRequestTitle,
        changeRequestsInReview,
        changeRequestType,
        checkBoxText,
        confirmation,
        errorAgreement,
        groupedBeforeApprovalBudgetLinesByServicesComponent,
        groupedUpdatedBudgetLinesByServicesComponent,
        handleApproveChangeRequests,
        handleCancel,
        hasPermissionToViewPage: userIsDivisionDirector,
        isLoadingAgreement,
        isAgreementAwarded,
        modalProps,
        notes,
        newAwardingEntity,
        oldAwardingEntity,
        projectOfficerName,
        alternateProjectOfficerName,
        requestorNoters,
        servicesComponents,
        setAfterApproval,
        setConfirmation,
        setNotes,
        setShowModal,
        showModal,
        statusChangeTo,
        statusForTitle,
        title,
        urlChangeToStatus
    };
};

export default useApproveAgreement;
