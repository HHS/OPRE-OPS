import { Route, Routes } from "react-router-dom";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import PageHeader from "../../../components/UI/PageHeader";
import { NO_DATA } from "../../../constants";
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
        CANFundingLoading,
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

    if (isLoading || CANFundingLoading) {
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
                        />
                    }
                />
            </Routes>
        </App>
    );
};

export default Can;
