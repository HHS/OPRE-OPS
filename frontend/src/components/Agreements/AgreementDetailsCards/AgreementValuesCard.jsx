import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";

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
            <ul>
                {fyValues.map((fyVal) => (
                    <li key={fyVal.fiscalYear}>
                        FY {fyVal.fiscalYear}: {fyVal.amount}
                    </li>
                ))}
            </ul>
        </CurrencySummaryCard>
    );
};

export default AgreementTotalBudgetLinesCard;
