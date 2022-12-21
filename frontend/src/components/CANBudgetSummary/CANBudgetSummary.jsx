import { useSelector, useDispatch } from "react-redux";
import { getCanFiscalYearByCan } from "../../api/getCanFiscalYear";
import { setCanFiscalYear, setPendingFunds, setSelectedFiscalYear } from "../../store/canDetailSlice";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import styles from "./CANBudgetSummary.module.css";
import constants from "../../constants";
import { getPortfolio } from "../../api/getPortfolio";
import { setPortfolio } from "../../store/portfolioSlice";
import { getPendingFunds } from "./util";

const fiscalYearOptions = [
    { label: "FY 2020", value: 2020 },
    { label: "FY 2021", value: 2021 },
    { label: "FY 2022", value: 2022 },
    { label: "FY 2023", value: 2023 },
    { label: "FY 2024", value: 2024 },
];
const defaultOption = fiscalYearOptions[2];

const CANBudgetSummary = () => {
    const dispatch = useDispatch();
    const canFiscalYear = useSelector((state) => state.canDetail.canFiscalYearObj);
    const pendingFunds = useSelector((state) => state.canDetail.pendingFunds);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const urlPathParams = useParams();
    const canFiscalYearId = parseInt(urlPathParams.id);

    const handleFiscalYearChange = (e) => {
        dispatch(setSelectedFiscalYear(e.value));
    };

    useEffect(() => {
        const getCanFiscalYearByCanAndSetState = async () => {
            const result = await getCanFiscalYearByCan(canFiscalYearId, defaultOption.value);

            const canFiscalYear = result[0];

            canFiscalYear ? dispatch(setCanFiscalYear(canFiscalYear)) : dispatch(setCanFiscalYear({}));

            dispatch(setPendingFunds(getPendingFunds(canFiscalYear)));
        };

        getCanFiscalYearByCanAndSetState().catch(console.error);

        return () => {
            dispatch(setCanFiscalYear({}));
            dispatch(setPendingFunds(constants.notFilledInText));
        };
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

    const customSelectStyle = {
        option: (provided, state) => ({
            ...provided,
            "background-color": state.isSelected ? "black" : provided["background-color"],
        }),
    };

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
                styles={customSelectStyle}
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

export default CANBudgetSummary;
