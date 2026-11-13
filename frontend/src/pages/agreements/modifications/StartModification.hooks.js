import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    useGetAgreementAwardHistoryByIdQuery,
    useGetAgreementByIdQuery,
    useGetAgreementContractModificationEditsByIdQuery,
    useGetAgreementContractModificationsByIdQuery,
    useGetServicesComponentsListQuery,
    useGetVersionQuery,
    useSubmitContractModificationMutation
} from "../../../api/opsAPI";
import { getAgreementTotalCardValues } from "../../../components/Agreements/AgreementBLIAccordion/AgreementBLIAccordion.helpers";
import { BLI_STATUS, groupByServicesComponent } from "../../../helpers/budgetLines.helpers";
import { scrollToTop } from "../../../helpers/scrollToTop.helper";
import useAlert from "../../../hooks/use-alert.hooks";
import useGetUserFullNameFromId from "../../../hooks/user.hooks";
import useToggle from "../../../hooks/useToggle";
import { getModBudgetLineDisabledReason } from "./StartModification.helpers";

export const PLANNED_TO_EXECUTING = { status: { old: BLI_STATUS.PLANNED, new: BLI_STATUS.EXECUTING } };

/**
 * Start Modification page (#3268, #3269): select Planned budget lines to execute and send the
 * agreement's pending edits (Modified LOE edits and Admin Changes such as a COR change) to the
 * Division Director as a Contract Modification.
 * @param {number} agreementId
 */
const EMPTY_AWARD_RECORD = {};

const useStartModification = (agreementId) => {
    const navigate = useNavigate();
    const { setAlert } = useAlert();
    const [budgetLines, setBudgetLines] = React.useState([]);
    const [toggleStates, setToggleStates] = React.useState({});
    const [notes, setNotes] = React.useState("");
    const [showModal, setShowModal] = React.useState(false);
    const [afterApproval, setAfterApproval] = useToggle(true);

    const { data: versionData, isLoading: isLoadingVersion } = useGetVersionQuery();
    const {
        data: agreement,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetAgreementByIdQuery(agreementId, { refetchOnMountOrArgChange: true, skip: !agreementId });
    const { data: servicesComponents } = useGetServicesComponentsListQuery(agreement?.id, { skip: !agreement });
    // Every pending edit goes into the modification: Modified LOE edits and Admin Changes such as
    // a COR change (#3269).
    const { data: edits = [] } = useGetAgreementContractModificationEditsByIdQuery(agreementId, {
        skip: !agreementId,
        refetchOnMountOrArgChange: true
    });
    const { data: modificationRequests = [], isLoading: isLoadingRequests } =
        useGetAgreementContractModificationsByIdQuery(agreementId, {
            skip: !agreementId,
            refetchOnMountOrArgChange: true
        });
    const [submitContractModification, { isLoading: isSubmitting }] = useSubmitContractModificationMutation();

    // The original award (the first record; modifications follow) for the agreement details. With
    // no award record yet the award fields still show, as TBD, so they don't silently go missing.
    const { data: awardHistory = [], isLoading: isLoadingAwardHistory } = useGetAgreementAwardHistoryByIdQuery(
        agreementId,
        { skip: !agreementId }
    );
    const awardRecord = awardHistory[0] ?? EMPTY_AWARD_RECORD;

    const projectOfficerName = useGetUserFullNameFromId(agreement?.project_officer_id);
    const alternateProjectOfficerName = useGetUserFullNameFromId(agreement?.alternate_project_officer_id);

    React.useEffect(() => {
        setBudgetLines(
            (agreement?.budget_line_items ?? []).map((bli) => {
                const disabledReason = getModBudgetLineDisabledReason(bli, servicesComponents);
                return { ...bli, selected: false, actionable: !disabledReason, disabledReason };
            })
        );
        setToggleStates({});
    }, [agreement, servicesComponents]);

    const isInReview = modificationRequests.some((request) => request.status === "IN_REVIEW");
    // Only an Awarded agreement with the capability on and no modification in review can start one.
    const canStartModification =
        Boolean(agreement?.is_awarded) && Boolean(versionData?.enable_modified_loe_edits) && !isInReview;
    // Wait for the award history too, so the award fields don't shift the details in after it loads.
    const isPageReady = !isLoadingAgreement && !isLoadingVersion && !isLoadingRequests && !isLoadingAwardHistory;

    const selectedBudgetLines = React.useMemo(() => budgetLines.filter((bli) => bli.selected), [budgetLines]);
    const groupedBudgetLinesByServicesComponent = groupByServicesComponent(budgetLines, servicesComponents);
    // Award Total in the agreement details is the Agreement Total card's total under Select Budget
    // Lines (UX, #3269), so it's computed the same way from the same inputs.
    const awardTotal = agreement
        ? getAgreementTotalCardValues(agreement, selectedBudgetLines, afterApproval).total
        : null;
    const isSubmissionReady = (edits.length > 0 || selectedBudgetLines.length > 0) && !isSubmitting;

    const handleSelectBLI = (bliId) => {
        setBudgetLines((prev) => prev.map((bli) => (+bli.id === +bliId ? { ...bli, selected: !bli.selected } : bli)));
    };

    const toggleSelectActionableBLIs = (servicesComponentNumber) => {
        const selected = !toggleStates[servicesComponentNumber];
        // Select by the rendered group's members: the API's budget lines carry services_component_id,
        // not the number the groups are keyed by.
        const group = groupedBudgetLinesByServicesComponent.find(
            (candidate) => candidate.servicesComponentNumber === servicesComponentNumber
        );
        const groupIds = new Set((group?.budgetLines ?? []).map((bli) => bli.id));
        setToggleStates((prev) => ({ ...prev, [servicesComponentNumber]: selected }));
        setBudgetLines((prev) =>
            prev.map((bli) => (bli.actionable && groupIds.has(bli.id) ? { ...bli, selected } : bli))
        );
    };

    const handleSendToApproval = async () => {
        try {
            await submitContractModification({
                agreementId,
                budgetLineItemIds: selectedBudgetLines.map((bli) => bli.id),
                requestorNotes: notes
            }).unwrap();
            setAlert({
                type: "success",
                heading: "Contract Modification Sent to Approval",
                message: "Your Contract Modification has been successfully sent to your Division Director to review.",
                redirectUrl: `/agreements/${agreementId}/award-modifications`
            });
        } catch {
            setAlert({
                type: "error",
                heading: "Error Sending Contract Modification",
                message: "There was an error sending your Contract Modification to approval. Please try again."
            });
            scrollToTop();
        }
    };

    const handleCancel = () => setShowModal(true);
    const confirmCancel = () => navigate(`/agreements/${agreementId}/award-modifications`);

    return {
        agreement,
        errorAgreement,
        isPageReady,
        canStartModification,
        servicesComponents,
        edits,
        budgetLines,
        groupedBudgetLinesByServicesComponent,
        selectedBudgetLines,
        handleSelectBLI,
        toggleSelectActionableBLIs,
        toggleStates,
        setToggleStates,
        afterApproval,
        setAfterApproval,
        notes,
        setNotes,
        isSubmissionReady,
        handleSendToApproval,
        awardRecord,
        awardTotal,
        projectOfficerName,
        alternateProjectOfficerName,
        showModal,
        setShowModal,
        handleCancel,
        confirmCancel
    };
};

export default useStartModification;
