import { ResponsiveBar } from "@nivo/bar";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";
import { data } from "./tempChartData.js";

const statusesExcludedFromValue = ["DRAFT", "UNDER_REVIEW"];
const AgreementTotalBudgetLinesCard = ({ budgetLineItems }) => {
    const headerText = "Total Agreement Value";
    const valuedBlis = budgetLineItems.filter((bli) => !statusesExcludedFromValue.includes(bli.status));
    const valuedBlisFy = valuedBlis.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
    const fyValuesMap = valuedBlisFy.reduce((acc, cur) => {
        if (!cur.fiscalYear || cur.amount == null) return acc;
        if (!(cur.fiscalYear in acc)) {
            acc[cur.fiscalYear] = cur.amount;
        } else {
            acc[cur.fiscalYear] = acc[cur.fiscalYear] + cur.amount;
        }
        return acc;
    }, {});
    const fyValues = Object.keys(fyValuesMap).map((fy) => ({ fiscalYear: fy, amount: fyValuesMap[fy] }));
    const totalValue = fyValues.reduce((acc, cur) => acc + cur.amount, 0);

    return (
        <CurrencySummaryCard headerText={headerText} amount={totalValue}>
            {/* <ul>
                {fyValues.map((fyVal) => (
                    <li key={fyVal.fiscalYear}>
                        FY {fyVal.fiscalYear}: {fyVal.amount}
                    </li>
                ))}
            </ul> */}
            <div className="width-full height-9">
                <ResponsiveBar
                    data={data}
                    keys={["budget"]}
                    indexBy="FY"
                    // margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    margin={{ bottom: 0, left: 50, right: 20, top: 0 }}
                    padding={0.3}
                    layout="horizontal"
                    colors={{ datum: "data.color" }}
                    borderColor={{
                        from: "color",
                        modifiers: [["darker", 1.6]],
                    }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={null}
                    enableGridY={false}
                    enableGridX={false}
                    enableLabel={true}
                    isInteractive={false}
                    role="application"
                    ariaLabel="Total Agreement Value by Fiscal Year"
                    borderRadius={2}
                    valueFormat=">-$,.2f"
                />
            </div>
        </CurrencySummaryCard>
    );
};

export default AgreementTotalBudgetLinesCard;
