import React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useGetCanByIdQuery, useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import { USER_ROLES } from "../../../components/Users/User.constants";
import { NO_DATA } from "../../../constants";
import { getTypesCounts } from "./Can.helpers";

export default function useCan() {
    /**
     *  @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
     *  @typedef {import("../../../components/CANs/CANTypes").FundingSummary} FundingSummary
     */

    const urlPathParams = useParams();
    const activeUser = useSelector((state) => state.auth.activeUser);
    const userRoles = activeUser?.roles ?? [];
    const isBudgetTeam = userRoles.includes(USER_ROLES.BUDGET_TEAM);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const canId = parseInt(urlPathParams.id ?? "-1");
    const initialModalProps = {
        heading: "",
        actionButtonText: "",
        secondaryButtonText: "",
        handleConfirm: () => {},
        showModal: false
    };
    const [modalProps, setModalProps] = React.useState(initialModalProps);
    const [isEditMode, setIsEditMode] = React.useState({
        detailPage: false,
        fundingPage: false
    });

    /** @type {{data?: CAN | undefined, isLoading: boolean}} */
    const { data: can, isLoading } = useGetCanByIdQuery(canId, {
        refetchOnMountOrArgChange: true
    });

    /** @type {{data?: FundingSummary | undefined, isLoading: boolean}} */
    const { data: CANFunding, isLoading: CANFundingLoading } = useGetCanFundingSummaryQuery({
        ids: [canId],
        fiscalYear: fiscalYear,
        refetchOnMountOrArgChange: true
    });


    const { data: previousFYfundingSummary } = useGetCanFundingSummaryQuery({
        ids: [canId],
        fiscalYear: fiscalYear - 1
    });

    const budgetLineItemsByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return [];

        return can?.budget_line_items?.filter((bli) => bli.fiscal_year === fiscalYear) ?? [];
    }, [can, fiscalYear]);

    const fundingReceivedByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return [];

        return can?.funding_received?.filter((fr) => fr.fiscal_year === fiscalYear) ?? [];
    }, [can, fiscalYear]);

    const projectTypesCount = React.useMemo(
        () => (can ? getTypesCounts(can.projects ?? [], "project_type") : []),
        [can]
    );

    const budgetLineTypesCount = React.useMemo(
        () => getTypesCounts(budgetLineItemsByFiscalYear, "status"),
        [budgetLineItemsByFiscalYear]
    );

    const budgetLinesAgreements = budgetLineItemsByFiscalYear?.map((item) => item.agreement) ?? [];

    /**
     * @type {import("../../../components/Agreements/AgreementTypes").SimpleAgreement[]} - Array of unique budget line agreements
     */
    const uniqueBudgetLineAgreements =
        budgetLinesAgreements?.reduce((acc, item) => {
            if (!acc.some((existingItem) => existingItem.name === item.name)) {
                acc.push(item);
            }
            return acc;
        }, []) ?? [];

    const agreementTypesCount = React.useMemo(
        () => getTypesCounts(uniqueBudgetLineAgreements, "agreement_type"),
        [fiscalYear, can]
    );

    const toggleDetailPageEditMode = () => {
        setIsEditMode({ ...isEditMode, detailPage: !isEditMode.detailPage });
    };

    const toggleFundingPageEditMode = () => {
        if (CANFunding?.total_funding === 0) {
            setModalProps({
                heading: `Welcome to FY ${fiscalYear}! The new fiscal year started on October 1, ${fiscalYear - 1} and it's time to add the FY budget for this CAN.  Data from the previous fiscal year can no longer be edited, but can be viewed by changing the FY dropdown on the CAN details page.`,
                actionButtonText: "Edit CAN",
                secondaryButtonText: "Cancel",
                showModal: true,
                handleConfirm: () => {
                    setIsEditMode({ ...isEditMode, fundingPage: !isEditMode.fundingPage });
                    setModalProps(initialModalProps);
                }
            });
        } else {
            setIsEditMode({ ...isEditMode, fundingPage: !isEditMode.fundingPage });
        }
    };

    const resetWelcomeModal = () => {
        setIsEditMode({
            ...isEditMode,
            fundingPage: false // only used on the funding page
        });
        setModalProps(initialModalProps);
    };

    const currentFiscalYearFundingId = can?.funding_budgets?.find((funding) => funding.fiscal_year === fiscalYear)?.id;

    return {
        can: can ?? null,
        currentFiscalYearFundingId,
        isLoading,
        canId,
        fiscalYear,
        CANFundingLoading,
        budgetLineItemsByFiscalYear,
        canNumber: can?.number ?? NO_DATA,
        description: can?.description,
        nickname: can?.nick_name,
        modalProps,
        fundingDetails: can?.funding_details ?? {},
        fundingBudgets: can?.funding_budgets ?? [],
        fundingReceivedByFiscalYear: fundingReceivedByFiscalYear,
        divisionId: can?.portfolio?.division_id ?? -1,
        teamLeaders: can?.portfolio?.team_leaders ?? [],
        portfolioName: can?.portfolio?.name,
        portfolioId: can?.portfolio_id ?? -1,
        totalFunding: CANFunding?.total_funding ?? 0,
        plannedFunding: CANFunding?.planned_funding ?? 0,
        obligatedFunding: CANFunding?.obligated_funding ?? 0,
        inExecutionFunding: CANFunding?.in_execution_funding ?? 0,
        inDraftFunding: CANFunding?.in_draft_funding ?? 0,
        receivedFunding: CANFunding?.received_funding ?? 0,
        carryForwardFunding: previousFYfundingSummary?.available_funding ?? 0,
        subTitle: can?.nick_name ?? "",
        projectTypesCount,
        budgetLineTypesCount,
        agreementTypesCount,
        isBudgetTeam,
        toggleDetailPageEditMode,
        toggleFundingPageEditMode,
        isEditMode,
        resetWelcomeModal
    };
}
