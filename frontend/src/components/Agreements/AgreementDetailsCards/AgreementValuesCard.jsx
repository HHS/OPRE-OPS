import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import { fiscalYearFromDate } from "../../../helpers/utils";

const AgreementTotalBudgetLinesCard = ({ budgetLineItems }) => {
    const headerText = "Total Agreement Value";
    const valuedBlisFy = budgetLineItems.map((bli) => ({ ...bli, fiscalYear: fiscalYearFromDate(bli.date_needed) }));
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
    const currentFiscalYear = fiscalYearFromDate(new Date());
    const nextThreeFyValues = fyValues.filter((fyVal) => {
        return fyVal.fiscalYear >= currentFiscalYear && fyVal.fiscalYear < currentFiscalYear + 3;
    })

    return (
        <CurrencySummaryCard headerText={headerText} amount={totalValue}>
            <div>next three</div>
            <ul>
                {nextThreeFyValues.map((fyVal) => (
                    <li key={fyVal.fiscalYear}>
                        FY {fyVal.fiscalYear}: {fyVal.amount}
                    </li>
                ))}
            </ul>
            <hr/>
            <div style={{color: "#999999", borderTop: "1em"}}>
                <div>All years</div>
                <ul style={{color: "#999999"}}>
                    {fyValues.map((fyVal) => (
                        <li key={fyVal.fiscalYear}>
                            FY {fyVal.fiscalYear}: {fyVal.amount}
                        </li>
                    ))}
                </ul>
            </div>
        </CurrencySummaryCard>
    );
};

export default AgreementTotalBudgetLinesCard;
