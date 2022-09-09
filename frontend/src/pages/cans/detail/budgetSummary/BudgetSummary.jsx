import { useSelector, useDispatch } from "react-redux";
import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import { setSelectedFiscalYear } from "./canFiscalYearSlice";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import styles from "./BudgetSummary.module.css";
import constants from "../../../../constants";

const fiscalYearOptions = [
    { label: "FY 2020", value: 2020 },
    { label: "FY 2021", value: 2021 },
    { label: "FY 2022", value: 2022 },
    { label: "FY 2023", value: 2023 },
    { label: "FY 2024", value: 2024 },
];
const defaultOption = fiscalYearOptions[2];

const BudgetSummary = () => {
    const dispatch = useDispatch();
    const canFiscalYear = useSelector((state) => state.canFiscalYearDetail.canFiscalYearObj);
    const pendingFunds = useSelector((state) => state.canFiscalYearDetail.pendingFunds);
    const selectedFiscalYear = useSelector((state) => state.canFiscalYearDetail.selectedFiscalYear);
    const urlPathParams = useParams();
    const canFiscalYearId = parseInt(urlPathParams.id);

    const handleFiscalYearChange = (e) => {
        dispatch(getCanFiscalYearByCan(canFiscalYearId, e.value));
        dispatch(setSelectedFiscalYear(e.value));
    };

    useEffect(() => {
        dispatch(getCanFiscalYearByCan(canFiscalYearId, defaultOption.value));
    }, [dispatch, canFiscalYearId]);

    const totalFiscalYearFundingTableData = (
        <td className={canFiscalYear?.total_fiscal_year_funding < 0 ? styles.redNegative : ""}>
            {canFiscalYear?.total_fiscal_year_funding || constants.notFilledInText}
        </td>
    );

    const amountAvailableTableData = (
        <td className={canFiscalYear?.amount_available < 0 ? styles.redNegative : ""}>
            {canFiscalYear?.amount_available || constants.notFilledInText}
        </td>
    );

    const pendingFundsTableData = <td className={pendingFunds < 0 ? styles.redNegative : ""}>{pendingFunds}</td>;

    return (
        <>
            <h2>Budget summary</h2>

            <Select
                className="left-float"
                options={fiscalYearOptions}
                onChange={handleFiscalYearChange}
                defaultValue={defaultOption}
                classNamePrefix="react-select"
                aria-label="Fiscal Year selection"
            />

            <table className="usa-table usa-table--borderless">
                <thead>
                    <tr>
                        <th scope="col">Funding status</th>
                        <th scope="col">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th scope="row">Total FY {selectedFiscalYear || constants.notFilledInText} Funding</th>
                        {totalFiscalYearFundingTableData}
                    </tr>
                    <tr>
                        <th scope="row">Funded YTD</th>
                        {amountAvailableTableData}
                    </tr>
                    <tr>
                        <th scope="row">Pending funds</th>
                        {pendingFundsTableData}
                    </tr>
                    <tr>
                        <th scope="row">Potential additional funding</th>
                        <td>{canFiscalYear?.potential_additional_funding || constants.notFilledInText}</td>
                    </tr>
                </tbody>
            </table>
        </>
    );
};

export default BudgetSummary;
