import { useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";
import { useGetCanByIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import PageHeader from "../../../components/UI/PageHeader";
import { setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import CANFiscalYearSelect from "../list/CANFiscalYearSelect";
import CanDetail from "./CanDetail";
import CanFunding from "./CanFunding";
import CanSpending from "./CanSpending";
import React from "react";
/**
 *  @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 *  @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

const Can = () => {
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id || "-1");
    /** @type {{data?: CAN | undefined, isLoading: boolean}} */
    const { data: can, isLoading } = useGetCanByIdQuery(canId);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);

    const filteredCANByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return {};
        return can.funding_details?.fiscal_year === fiscalYear ? can : {};
    }, [can, fiscalYear]);

    if (isLoading) {
        return <div> Loading Can... </div>;
    }
    if (!can) {
        return <div>Can not found</div>;
    }

    const { number, description, nick_name: nickname, portfolio } = can;

    /** @type {{budget_line_items?: BudgetLine[]}} */
    const { budget_line_items: budgetLines } = filteredCANByFiscalYear;
    const { division_id: divisionId, team_leaders: teamLeaders, name: portfolioName } = portfolio;
    const noData = "TBD";
    const subTitle = `${can.nick_name} - ${can.active_period} ${can.active_period > 1 ? "Years" : "Year"}`;

    return (
        <App breadCrumbName={can.display_name}>
            <PageHeader
                title={can.display_name || noData}
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
                            description={description ?? noData}
                            nickname={nickname || noData}
                            number={number}
                            portfolioName={portfolioName ?? noData}
                            teamLeaders={teamLeaders ?? []}
                        />
                    }
                />
                <Route
                    path="spending"
                    element={
                        <CanSpending
                            budgetLines={budgetLines ?? []}
                            fiscalYear={fiscalYear}
                            canId={canId}
                        />
                    }
                />
                <Route
                    path="funding"
                    element={<CanFunding />}
                />
            </Routes>
        </App>
    );
};

export default Can;
