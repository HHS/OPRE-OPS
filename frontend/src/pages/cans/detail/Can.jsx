import { Route, Routes } from "react-router-dom";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import PageHeader from "../../../components/UI/PageHeader";
import { NO_DATA } from "../../../constants";
import { setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import CANFiscalYearSelect from "../list/CANFiscalYearSelect";
import useCan from "./Can.hooks";
import CanDetail from "./CanDetail";
import CanFunding from "./CanFunding";
import CanSpending from "./CanSpending";
/**
 *  @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 */

const Can = () => {
    const {
        can,
        isLoading,
        canId,
        fiscalYear,
        CANFundingLoading,
        budgetLineItemsByFiscalYear,
        number,
        description,
        nickname,
        fundingDetails,
        fundingBudgets,
        divisionId,
        teamLeaders,
        portfolioName,
        totalFunding,
        plannedFunding,
        obligatedFunding,
        inExecutionFunding,
        subTitle,
        projectTypesCount,
        budgetLineTypesCount,
        testAgreements,
        expectedFunding,
        receivedFunding
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
                <CANFiscalYearSelect
                    fiscalYear={fiscalYear}
                    setSelectedFiscalYear={setSelectedFiscalYear}
                />
            </section>
            <Routes>
                <Route
                    path=""
                    element={
                        <CanDetail
                            divisionId={divisionId}
                            description={description ?? NO_DATA}
                            nickname={nickname ?? NO_DATA}
                            number={number}
                            portfolioName={portfolioName ?? NO_DATA}
                            teamLeaders={teamLeaders ?? []}
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
                            agreementTypesCount={testAgreements}
                            inExecutionFunding={inExecutionFunding}
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
                            funding={fundingDetails}
                            fundingBudgets={fundingBudgets}
                            fiscalYear={fiscalYear}
                            expectedFunding={expectedFunding}
                            receivedFunding={receivedFunding}
                        />
                    }
                />
            </Routes>
        </App>
    );
};

export default Can;
