import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementByIdQuery,
    useGetAgreementContractModificationsByIdQuery,
    useGetGrantNumbersListQuery,
    useGetServicesComponentsListQuery
} from "../../../api/opsAPI";
import { budgetLinesTotal, groupByGrantNumber, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useContractModificationReview from "../../../hooks/useContractModificationReview.hooks";
import { AgreementType } from "../agreements.constants";

const MODIFIED_LOE_STATUS_FIELD = "status";

/**
 * A mod's changed field per budget line id (OPS-6489): "status" for a Planned<->Executing
 * status edit, "amount" for a de-obligation -- the two cells the Mod Approval page's budget
 * lines table highlights (see BLIReviewRow's `highlightedField`). Other edit fields (CAN,
 * Obligate By, Services Component changes, COR changes) aren't tied to a single highlightable
 * table cell, so they're left alone here -- they're still shown in full on the "Review Contract
 * Modification" edit cards above the table.
 * @param {any[]} edits
 * @returns {Object.<number, "status"|"amount">}
 */
const buildHighlightedFieldByBudgetLineId = (edits) => {
    /** @type {Object.<number, "status"|"amount">} */
    const highlighted = {};
    for (const edit of edits ?? []) {
        if (edit.budget_line_item_id == null) continue;
        if (edit.modification_type === "DE_OBLIGATION") {
            highlighted[edit.budget_line_item_id] = "amount";
        } else if (edit.field === MODIFIED_LOE_STATUS_FIELD) {
            highlighted[edit.budget_line_item_id] = "status";
        }
    }
    return highlighted;
};

/**
 * Data and actions for the Mod Approval review page (OPS-6489): the single dedicated review
 * page for every Contract Modification Request type (Modified LOE, Admin/COR, As-Is, and
 * De-obligation) -- they all render the same generic layout for now.
 * @param {number} agreementId
 */
export default function useApproveModApproval(agreementId) {
    const navigate = useNavigate();

    const { data: agreement, isLoading: isLoadingAgreement } = useGetAgreementByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreementId, { skip: !agreementId });
    const { data: grantNumbers } = useGetGrantNumbersListQuery(agreementId, { skip: !agreementId });
    const { data: modificationRequests = [], isLoading: isLoadingRequests } =
        useGetAgreementContractModificationsByIdQuery(agreementId, {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        });

    const request = useMemo(
        () => modificationRequests.find((modRequest) => modRequest.status === "IN_REVIEW"),
        [modificationRequests]
    );

    const isGrant = agreement?.agreement_type === AgreementType.GRANT;
    const allBudgetLines = useMemo(() => agreement?.budget_line_items ?? [], [agreement?.budget_line_items]);
    const groupedBudgetLinesByServicesComponent = useMemo(
        () =>
            isGrant
                ? groupByGrantNumber(allBudgetLines, grantNumbers ?? [])
                : groupByServicesComponent(allBudgetLines, servicesComponents || []),
        [isGrant, allBudgetLines, grantNumbers, servicesComponents]
    );
    // The lines this request would move from Planned to Executing -- not every IN_EXECUTION
    // line on the agreement, which is what the award/pre-award approval pages show instead.
    const executingTotal = useMemo(() => budgetLinesTotal(request?.budget_line_items ?? []), [request]);

    const highlightedFieldByBudgetLineId = useMemo(
        () => buildHighlightedFieldByBudgetLineId(request?.edits),
        [request]
    );

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);
    const requestorName = useGetUserFullNameFromId(request?.created_by);

    const [reviewerNotes, setReviewerNotes] = useState("");
    const { showModal, setShowModal, modalProps, handleReview, isSubmitDisabled, submitError } =
        useContractModificationReview(request ?? { id: null, agreement_id: agreementId, budget_line_items: [] });

    const handleCancel = () => navigate("/agreements?filter=change-requests");

    return {
        agreement,
        isLoading: isLoadingAgreement || isLoadingRequests,
        request,
        hasPermission: Boolean(request?.can_review),
        allBudgetLines,
        servicesComponents,
        groupedBudgetLinesByServicesComponent,
        totalGrantNumbers: (grantNumbers ?? []).length,
        executingTotal,
        highlightedFieldByBudgetLineId,
        projectOfficerName,
        alternateProjectOfficerName,
        requestorName,
        reviewerNotes,
        setReviewerNotes,
        showModal,
        setShowModal,
        modalProps,
        handleApprove: () => handleReview("APPROVE", reviewerNotes || null),
        handleDecline: () => handleReview("DECLINE", reviewerNotes || null),
        handleCancel,
        isSubmitDisabled,
        submitError
    };
}
