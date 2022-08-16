import { useSelector, useDispatch } from "react-redux";
import { getCanFiscalYearByCan } from "./getCanFiscalYear";
import { setSelectedFiscalYear } from "./canFiscalYearSlice";
import Select from "react-select";
import { useParams } from "react-router-dom";
import { useEffect } from "react";
import "./budgetSummary.css";

const BudgetSummary = () => {
    const dispatch = useDispatch();
    const canFiscalYear = useSelector((state) => state.canFiscalYearDetail.canFiscalYearObj);
    const selectedFiscalYear = useSelector((state) => state.canFiscalYearDetail.selectedFiscalYear);
    const urlPathParams = useParams();

    const handleChange = (e) => {
        dispatch(getCanFiscalYearByCan(urlPathParams.id, e.value));
        dispatch(setSelectedFiscalYear(e.value));
    };

    const options = [
        { label: "FY 2020", value: 2020 },
        { label: "FY 2021", value: 2021 },
        { label: "FY 2022", value: 2022 },
        { label: "FY 2023", value: 2023 },
        { label: "FY 2024", value: 2024 },
    ];
    const defaultOption = options[2];

    useEffect(() => {
        dispatch(getCanFiscalYearByCan(urlPathParams.id, defaultOption.value));
    }, [dispatch, defaultOption.value, urlPathParams.id]);

    const negativeRedStylingClass = "red-negative";
    const notFilledInText = "--";

    const totalFiscalYearFundingTableData = (
        <td className={canFiscalYear?.total_fiscal_year_funding < 0 ? negativeRedStylingClass : ""}>
            {canFiscalYear?.total_fiscal_year_funding || notFilledInText}
        </td>
    );

    return (
        <div>
            <div className="info-head">
                <Select className="left-float" options={options} onChange={handleChange} defaultValue={defaultOption} />
            </div>
            <div className="rounded-box">
                <div className="info-unit">
                    <h2 className="info-unit">Budget summary</h2>
                    <div className="info-unit flex">
                        <table className="one-flex">
                            <tbody>
                                <tr>
                                    <th>Funding status</th>
                                    <th>Amount</th>
                                </tr>
                                <tr>
                                    <td>Total FY {selectedFiscalYear || "--"} Funding</td>
                                    {totalFiscalYearFundingTableData}
                                </tr>
                                <tr>
                                    <td>Funded YTD</td>
                                    <td>{canFiscalYear?.amount_available || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Pending funds</td>
                                    <td>
                                        {canFiscalYear?.total_fiscal_year_funding && canFiscalYear?.amount_available
                                            ? canFiscalYear.total_fiscal_year_funding - canFiscalYear.amount_available
                                            : "n/a"}
                                    </td>
                                </tr>
                                <tr>
                                    <td> </td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                        <table className="one-flex">
                            <tbody>
                                <tr>
                                    <th>Spending plan status</th>
                                    <th>Amount</th>
                                </tr>
                                <tr>
                                    <td>Total FY {selectedFiscalYear || "--"} Funding</td>
                                    {totalFiscalYearFundingTableData}
                                </tr>
                                <tr>
                                    <td>Total in process spending</td>
                                    {totalFiscalYearFundingTableData}
                                </tr>
                                <tr>
                                    <td>Remaining planned spending</td>
                                    {totalFiscalYearFundingTableData}
                                </tr>
                                <tr>
                                    <td>Unplanned (CAN balance)</td>
                                    {totalFiscalYearFundingTableData}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="info-unit">
                        <table className="one-flex">
                            <caption>Potential additional funding</caption>
                            <tbody>
                                <tr>
                                    <th>Source/description</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Last update</th>
                                    <th>Comments</th>
                                </tr>
                                <tr>
                                    <td>Department</td>
                                    <td>{canFiscalYear?.potential_additional_funding || "n/a"}</td>
                                    <td>In process</td>
                                    <td>1/1/2022</td>
                                    <td>💬</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BudgetSummary;
