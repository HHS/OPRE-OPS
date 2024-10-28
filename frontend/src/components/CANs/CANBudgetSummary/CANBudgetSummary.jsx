import { useSelector, useDispatch } from "react-redux";
import { getCanFiscalYearByCan } from "../../../api/getCanFiscalYear";
import { setCanFiscalYear, setPendingFunds, setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import styles from "./CANBudgetSummary.module.css";
import constants from "../../../constants";
import { getPendingFunds } from "./util";
import FiscalYear from "../../UI/FiscalYear";

const CANBudgetSummary = () => {
    const dispatch = useDispatch();
    const canFiscalYear = useSelector((state) => state.canDetail.canFiscalYearObj);
    const pendingFunds = useSelector((state) => state.canDetail.pendingFunds);
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);
    const fiscalYear = Number(selectedFiscalYear.value);
    const urlPathParams = useParams();
    const canFiscalYearId = parseInt(urlPathParams.id);

    useEffect(() => {
        const getCanFiscalYearByCanAndSetState = async () => {
            const result = await getCanFiscalYearByCan(canFiscalYearId, selectedFiscalYear.value);

            const canFiscalYear = result[0];

            canFiscalYear ? dispatch(setCanFiscalYear(canFiscalYear)) : dispatch(setCanFiscalYear({}));

            dispatch(setPendingFunds(getPendingFunds(canFiscalYear)));
        };

        getCanFiscalYearByCanAndSetState().catch(console.error);

        return () => {
            dispatch(setCanFiscalYear({}));
            dispatch(setPendingFunds(constants.notFilledInText));
        };
    }, [dispatch, canFiscalYearId, selectedFiscalYear]);

    const totalFiscalYearFundingTableData = (
        <td className={canFiscalYear?.total_funding < 0 ? styles.redNegative : ""}>
            {canFiscalYear?.total_funding || constants.notFilledInText}
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

            <FiscalYear
                fiscalYear={fiscalYear}
                handleChangeFiscalYear={setSelectedFiscalYear}
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
                        <th scope="row">Total FY {fiscalYear || constants.notFilledInText} Funding</th>
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
