import { useSelector, useDispatch } from "react-redux";
import { getCfyByCan } from "./getCfy";
import { useEffect, useState } from "react";
import Select from "react-select";
import { useParams } from "react-router-dom";

const BudgetSummary = () => {
    const dispatch = useDispatch();
    const cfy = useSelector((state) => state.cfyDetail.cfy);
    const urlPathParams = useParams();
    const [selectedValue, setSelectedValue] = useState(0);
    const handleChange = (e) => {
        setSelectedValue(e.value);
        // console.log(cfy[0].fiscal_year);
    };

    const options = [
        { label: "FY 2020", value: 2020 },
        { label: "FY 2021", value: 2021 },
        { label: "FY 2022", value: 2022 },
        { label: "FY 2023", value: 2023 },
        { label: "FY 2024", value: 2024 },
    ];

    useEffect(() => {
        dispatch(getCfyByCan(urlPathParams.id, selectedValue));
    }, [dispatch, urlPathParams.id, selectedValue]);

    return (
        <div>
            <div className="info-head">
                <Select
                    className="left-float"
                    options={options}
                    value={options.find((obj) => obj.value === selectedValue)}
                    onChange={handleChange}
                    defaultValue="2022"
                />
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
                                    <td>Total FY {cfy[0]?.fiscal_year || "--"} Funding</td>
                                    <td>{cfy[0]?.total_fiscal_year_funding || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Funded YTD</td>
                                    <td>{cfy[0]?.amount_available || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Pending funds</td>
                                    <td>
                                        {(cfy[0]?.total_fiscal_year_funding - cfy[0]?.amount_available).toFixed(2) ||
                                            "n/a"}
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
                                    <td>Total FY {cfy[0]?.fiscal_year || "--"} Funding</td>
                                    <td>{cfy[0]?.total_fiscal_year_funding || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Total in process spending</td>
                                    <td>{cfy[0]?.total_fiscal_year_funding || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Remaining planned spending</td>
                                    <td>{cfy[0]?.total_fiscal_year_funding || "n/a"}</td>
                                </tr>
                                <tr>
                                    <td>Unplanned (CAN balance)</td>
                                    <td>{cfy[0]?.total_fiscal_year_funding || "n/a"}</td>
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
                                    <td>{cfy[0]?.potential_additional_funding || "n/a"}</td>
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
