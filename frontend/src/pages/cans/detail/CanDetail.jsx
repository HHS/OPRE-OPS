import { useSelector, useDispatch } from "react-redux";
import { getCan } from "./getCan";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import BudgetSummary from "./budgetSummary/BudgetSummary.jsx";
import constants from "../../../constants";
import App from "../../../App";
import { BreadcrumbItem, BreadcrumbList } from "../../../components/Header/Breadcrumb";

const CanDetail = () => {
    const dispatch = useDispatch();
    const can = useSelector((state) => state.canDetail.can);
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id);
    useEffect(() => {
        dispatch(getCan(canId));
    }, [dispatch, canId]);

    return (
        <>
            <App>
                <BreadcrumbList>
                    <BreadcrumbItem isCurrent pageName="CANs" />
                </BreadcrumbList>
                <h1>
                    {can?.number} ({can?.nickname})
                </h1>

                <div className="grid-container">
                    <div className="grid-row">
                        <div className="grid-col">
                            <h2>CAN description</h2>
                            {can?.description}
                            <h2>CAN purpose</h2>
                            {can.purpose || constants.notFilledInText}
                            <h2>Arrangement type</h2>
                            {can?.arrangement_type?.name}
                            <h2>Funding source</h2>
                            {can.funding_source?.[0]?.nickname || constants.notFilledInText}
                            <h2>OPRE point of contact</h2>
                            {can.authorizer?.name}
                            <h2>OPRE division</h2>
                            {can.division || constants.notFilledInText}
                        </div>

                        <div className="grid-col">
                            <BudgetSummary />
                        </div>
                    </div>
                </div>
            </App>
        </>
    );
};

export default CanDetail;
