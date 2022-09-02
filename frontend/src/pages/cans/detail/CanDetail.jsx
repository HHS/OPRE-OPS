import { useSelector, useDispatch } from "react-redux";
import { getCan } from "./getCan";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import BudgetSummary from "./budgetSummary/BudgetSummary.jsx";
import constants from "../../../constants";

const CanDetail = () => {
    const dispatch = useDispatch();
    const can = useSelector((state) => state.canDetail.can);
    const urlPathParams = useParams();

    useEffect(() => {
        dispatch(getCan(urlPathParams.id));
    }, [dispatch, urlPathParams.id]);

    return (
        <>
            <h1>
                {can.number} ({can.nickname})
            </h1>

            <div className="grid-container">
                <div className="grid-row">
                    <div className="grid-col">
                        <h3>CAN description</h3>
                        {can.description}
                        <h3>CAN purpose</h3>
                        {can.purpose || constants.notFilledInText}
                        <h3>Arrangement type</h3>
                        {can.arrangement_type}
                        <h3>Funding source</h3>
                        {can.funding_source?.[0]?.nickname || constants.notFilledInText}
                        <h3>OPRE point of contact</h3>
                        {can.authorizer?.name}
                        <h3>OPRE division</h3>
                        {can.division || constants.notFilledInText}
                    </div>

                    <div className="grid-col">
                        <BudgetSummary />
                    </div>
                </div>
            </div>
        </>
    );
};

export default CanDetail;
