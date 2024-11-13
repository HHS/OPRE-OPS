import React from "react";
import { useSelector } from "react-redux";
import { Route, Routes, useParams } from "react-router-dom";
import { useGetCanByIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import PageHeader from "../../../components/UI/PageHeader";
import { NO_DATA } from "../../../constants";
import { setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import CANFiscalYearSelect from "../list/CANFiscalYearSelect";
import CanDetail from "./CanDetail";
import CanFunding from "./CanFunding";
import CanSpending from "./CanSpending";
/**
 *  @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 *  @typedef {import("../../../components/BudgetLineItems/BudgetLineTypes").BudgetLine} BudgetLine
 */

const getTypesCounts = (items, keyToCount) => {
    if (!items || items.length === 0) return [];

    return Object.entries(
        items.reduce((acc, item) => {
            const type = item[keyToCount];
            if (!acc[type]) {
                acc[type] = 0;
            }
            acc[type]++;
            return acc;
        }, {})
    ).map(([type, count]) => ({ type, count }));
};

const Can = () => {
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id || "-1");
    /** @type {{data?: CAN | undefined, isLoading: boolean}} */
    const { data: can, isLoading } = useGetCanByIdQuery(canId);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);

    const budgetLineItemsByFiscalYear = React.useMemo(() => {
        if (!fiscalYear || !can) return [];

        return can.budget_line_items?.filter((bli) => bli.fiscal_year === fiscalYear) ?? [];
    }, [can, fiscalYear]);

    if (isLoading) {
        return <div> Loading CAN... </div>;
    }
    if (!can) {
        return <div>CAN not found</div>;
    }

    const { number, description, nick_name: nickname, portfolio, projects } = can;
    const { division_id: divisionId, team_leaders: teamLeaders, name: portfolioName } = portfolio;

    const subTitle = `${can.nick_name} - ${can.active_period} ${can.active_period > 1 ? "Years" : "Year"}`;

    const projectTypesCount = getTypesCounts(projects, "project_type");
    const budgetLineTypesCount = getTypesCounts(budgetLineItemsByFiscalYear, "status");
    const testAgreements = [
        { type: "CONTRACT", count: 8 },
        { type: "GRANT", count: 2 }
        // { type: "DIRECT_ALLOCATION", count: 1 },
        // { type: "IAA", count: 1 }
        // { type: "MISCELLANEOUS", count: 1 }
    ];

    return (
        <App breadCrumbName={can.display_name}>
            <PageHeader
                title={can.display_name || NO_DATA}
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
                            nickname={nickname || NO_DATA}
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
                            canId={canId}
                            projects={projectTypesCount}
                            budgetLineTypesCount={budgetLineTypesCount}
                            agreements={testAgreements}
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
