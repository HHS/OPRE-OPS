import { Route, Routes, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import PageHeader from "../../../components/UI/PageHeader";
import { NO_DATA } from "../../../constants";
import { LIST_CRUMBS, resolveAncestryForChildren } from "../../../helpers/breadcrumb.helpers";
import CANFiscalYearSelect from "../list/CANFiscalYearSelect";
import useCan from "./Can.hooks";
import CanDetail from "./CanDetail";
import CanFunding from "./CanFunding";
import CanSpending from "./CanSpending";
/**
 *  @typedef {import("../../../types/CANTypes").CAN} CAN
 */

const Can = () => {
    const {
        can,
        currentFiscalYearFundingId,
        isLoading,
        canId,
        fiscalYear,
        setSelectedFiscalYear,
        isTableLoading,
        budgetLineItemsByFiscalYear,
        canNumber,
        description,
        nickname,
        modalProps,
        resetWelcomeModal,
        fundingDetails,
        fundingBudgets,
        fundingReceivedByFiscalYear,
        divisionId,
        teamLeaders,
        portfolioName,
        portfolioId,
        totalFunding,
        plannedFunding,
        obligatedFunding,
        inExecutionFunding,
        inDraftFunding,
        subTitle,
        projectTypesCount,
        budgetLineTypesCount,
        agreementTypesCount,
        receivedFunding,
        isBudgetTeam,
        carryForwardFunding,
        isEditMode,
        toggleDetailPageEditMode,
        toggleFundingPageEditMode
    } = useCan();

    // Compose the ancestry that child entry-point links (CANBudgetLineTable) should
    // record when navigating to an agreement. If the user drilled into this CAN via a
    // known path (e.g. Portfolios > Portfolio A > CAN 1) the stored trail supplies the
    // ancestors; otherwise fall back to the CANs list. The leaf is this CAN.
    const { pathname } = useLocation();
    const storedTrail = useSelector((state) => state.sessionUI?.navContext?.trail);
    const linkAncestry = resolveAncestryForChildren({
        trail: storedTrail,
        pathname,
        ownCrumb: { label: can?.display_name ?? "CAN", to: `/cans/${canId}` },
        fallbackCrumb: LIST_CRUMBS.cans
    });

    if (isLoading) {
        return <p>Loading CAN...</p>;
    }

    if (!can) {
        return <p>Error: CAN not found</p>;
    }

    return (
        <App breadCrumbName={can.display_name}>
            <PageHeader
                title={can.display_name ?? NO_DATA}
                subTitle={subTitle}
            />

            <section className="display-flex flex-justify margin-top-3">
                <CanDetailTabs canId={canId} />
                {!isEditMode.detailPage && !isEditMode.fundingPage && (
                    <CANFiscalYearSelect
                        fiscalYear={fiscalYear}
                        setSelectedFiscalYear={setSelectedFiscalYear}
                        showAllOption={false}
                    />
                )}
            </section>
            <Routes>
                <Route
                    path=""
                    element={
                        <CanDetail
                            canId={canId}
                            divisionId={divisionId}
                            description={description ?? NO_DATA}
                            nickname={nickname ?? NO_DATA}
                            canNumber={canNumber}
                            portfolioName={portfolioName ?? NO_DATA}
                            portfolioId={portfolioId}
                            teamLeaders={teamLeaders ?? []}
                            fiscalYear={fiscalYear}
                            isBudgetTeamMember={isBudgetTeam}
                            isEditMode={isEditMode.detailPage}
                            toggleEditMode={toggleDetailPageEditMode}
                        />
                    }
                />
                <Route
                    path="spending"
                    element={
                        <CanSpending
                            budgetLines={budgetLineItemsByFiscalYear}
                            fiscalYear={fiscalYear}
                            projectTypesCount={projectTypesCount}
                            budgetLineTypesCount={budgetLineTypesCount}
                            agreementTypesCount={agreementTypesCount}
                            inExecutionFunding={inExecutionFunding}
                            inDraftFunding={inDraftFunding}
                            obligatedFunding={obligatedFunding}
                            plannedFunding={plannedFunding}
                            totalFunding={totalFunding}
                            isTableLoading={isTableLoading}
                            ancestry={linkAncestry}
                        />
                    }
                />
                <Route
                    path="funding"
                    element={
                        <CanFunding
                            canId={canId}
                            canNumber={canNumber}
                            welcomeModal={modalProps}
                            resetWelcomeModal={resetWelcomeModal}
                            currentFiscalYearFundingId={currentFiscalYearFundingId}
                            funding={fundingDetails}
                            fundingBudgets={fundingBudgets}
                            fiscalYear={fiscalYear}
                            receivedFunding={receivedFunding}
                            totalFunding={totalFunding}
                            fundingReceived={fundingReceivedByFiscalYear}
                            isBudgetTeamMember={isBudgetTeam}
                            isEditMode={isEditMode.fundingPage}
                            toggleEditMode={toggleFundingPageEditMode}
                            carryForwardFunding={carryForwardFunding}
                            isExpired={can?.is_expired}
                            isTableLoading={isTableLoading}
                        />
                    }
                />
            </Routes>
        </App>
    );
};

export default Can;
