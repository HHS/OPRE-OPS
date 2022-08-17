import { useSelector, useDispatch } from "react-redux";
import { getCan } from "./getCan";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import BudgetSummary from "./BudgetSummary.jsx";

const CanDetail = () => {
    const dispatch = useDispatch();
    const can = useSelector((state) => state.canDetail.can);
    const urlPathParams = useParams();

    useEffect(() => {
        dispatch(getCan(urlPathParams.id));
    }, [dispatch, urlPathParams.id]);

    return (
        <main>
            <section className="flex">
                <div className="one-flex">
                    <div className="info-head">
                        <a className="right-float" href="#">
                            Download custom report
                        </a>
                        <h1>
                            {can.number} ({can.nickname})
                        </h1>
                    </div>
                    <div className="rounded-box">
                        <div className="info-unit">
                            <h2>CAN information</h2>
                        </div>
                        <div className="info-unit">
                            <h3>CAN description</h3>
                            {can.description}
                        </div>
                        <div className="info-unit">
                            <h3>CAN purpose</h3>
                            {can.purpose || "n/a"}
                        </div>
                        <div className="info-unit">
                            <h3>Arrangement type</h3>
                            {can.arrangement_type}
                        </div>
                        <div className="info-unit">
                            <h3>Funding source</h3>
                            {can.funding_source?.[0]?.nickname || "n/a"}
                        </div>
                        <div className="info-unit">
                            <h3>OPRE CAN point of contact</h3>
                            {can.authorizer?.name}
                        </div>
                        <div className="info-unit">
                            <h3>OPRE division</h3>
                            {can.division || "n/a"}
                        </div>
                    </div>
                </div>
                <div className="two-flex">
                    <BudgetSummary />
                </div>
            </section>
            <section className="rounded-box">
                <div className="info-unit">
                    <h2>
                        Breakdown of contracts and budget lines funded by CAN
                        {can.number} ({can.nickname}) for FY 2022
                    </h2>
                </div>
                <table className="one-flex">
                    <tbody>
                        <tr>
                            <th>Contracts and budget lines</th>
                            <th>CAN contrib</th>
                            <th>% of total</th>
                            <th>Additoinal funding</th>
                            <th>Research areas</th>
                            <th>Point of contact</th>
                        </tr>
                        <tr>
                            <td>
                                <details>
                                    <summary>NIH VIQI</summary>
                                    <table>
                                        <tbody>
                                            <tr>
                                                <td>SC 1</td>
                                                <td>$992,000</td>
                                            </tr>
                                            <tr>
                                                <td>SC 1 Fee</td>
                                                <td>$8,000</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </details>
                            </td>
                            <td>$1,000,000</td>
                            <td>80%</td>
                            <td>
                                <a href="#" className="cartouche">
                                    CAN
                                </a>
                            </td>
                            <td>
                                <a href="#" className="cartouche">
                                    Area
                                </a>
                            </td>
                            <td>👤 Person</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main>
    );
};

export default CanDetail;
