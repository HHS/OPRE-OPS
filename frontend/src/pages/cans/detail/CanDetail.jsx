import { useSelector, useDispatch } from "react-redux";
import { getCan } from "./getCan";
import { useEffect } from "react";
import CANBudgetSummary from "../../../components/CANs/CANBudgetSummary/CANBudgetSummary.jsx";
import constants from "../../../constants";
import { setCan } from "./canDetailSlice";
import { useParams } from "react-router-dom";

const CanDetail = () => {
    const dispatch = useDispatch();
    const can = useSelector((state) => state.canDetail.can);
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id);

    useEffect(() => {
        const getCANAndSetState = async (canId) => {
            const results = await getCan(canId);
            dispatch(setCan(results));
        };

        getCANAndSetState(canId).catch(console.error);
    }, [dispatch, canId]);

    return (
        <article>
            <h1>
                {can?.number} ({can?.nick_name})
            </h1>
            <div className="grid-row">
                <div className="grid-col">
                    <h2>CAN description</h2>
                    {can?.description}
                    <h2>CAN purpose</h2>
                    {can.purpose || constants.notFilledInText}
                    <h2>Arrangement type</h2>
                    {can?.arrangement_type?.name}
                    <h2>Funding source</h2>
                    {can.funding_source?.[0]?.nick_name || constants.notFilledInText}
                    <h2>OPRE point of contact</h2>
                    {can.authorizer?.name}
                    <h2>OPRE division</h2>
                    {can.division || constants.notFilledInText}
                </div>

                <div className="grid-col">
                    <CANBudgetSummary />
                </div>
            </div>
        </article>
    );
};

export default CanDetail;
