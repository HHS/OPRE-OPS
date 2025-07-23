import ReviewCard from "../ReviewCard";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants.js";
import { useGetAgreementByIdQuery, useGetProcurementShopsQuery } from "../../../api/opsAPI";
import TermTag from "../TermTag";
import { NO_DATA } from "../../../constants";
import { calculateTotal } from "../../../helpers/agreement.helpers.js";
import { convertToCurrency } from "../../../helpers/utils";

function ProcurementShopReviewCard({
    changeRequestId,
    agreementId,
    requesterName,
    requestDate,
    changeTo,
    handleReviewChangeRequest,
    isCondensed = false,
    forceHover = false,
    oldAwardingEntityId,
    newAwardingEntityId
}) {
    const { data: procurementShops, isLoading: isGetProcurementShopLoading } = useGetProcurementShopsQuery();
    const oldAwardingEntity = procurementShops?.find((shop) => shop.id === oldAwardingEntityId);
    const newAwardingEntity = procurementShops?.find((shop) => shop.id === newAwardingEntityId);
    const { data: agreementData, isLoading: isLoadingAgreementData } = useGetAgreementByIdQuery(agreementId);

    console.log({ oldAwardingEntity });
    console.log({ agreementData });

    if (isGetProcurementShopLoading || isLoadingAgreementData) {
        return <h1>Loading...</h1>;
    }

    const oldTotal = calculateTotal(
        agreementData?.budget_line_items ?? [],
        (oldAwardingEntity?.fee_percentage ?? 0) / 100
    );

    const newTotal = calculateTotal(
        agreementData?.budget_line_items ?? [],
        (newAwardingEntity?.fee_percentage ?? 0) / 100
    );

    const oldValues = [
        oldAwardingEntity ? oldAwardingEntity.abbr : NO_DATA,
        oldAwardingEntity.fee_percentage !== undefined ? `${oldAwardingEntity.fee_percentage}%` : NO_DATA,
        convertToCurrency(oldTotal)
    ];

    const newValues = [
        newAwardingEntity ? newAwardingEntity.abbr : NO_DATA,
        newAwardingEntity.fee_percentage !== undefined ? `${newAwardingEntity.fee_percentage}%` : NO_DATA,
        convertToCurrency(newTotal)
    ];

    const procurementShopNameChange = `Procurement Shop: ${oldAwardingEntity?.name} (${oldAwardingEntity?.abbr}) to ${newAwardingEntity?.name} (${newAwardingEntity?.abbr})`;
    const procurementFeePercentageChange = `Fee Rate: ${oldAwardingEntity?.fee_percentage}% to ${oldAwardingEntity?.fee_percentage}%`;
    const procurementShopFeeTotalChange = `Fee Total: ${convertToCurrency(oldTotal)} to ${convertToCurrency(newTotal)}`;
    const changeMsg = `\u2022 ${procurementShopNameChange}<br>\u2022 ${procurementFeePercentageChange}<br>\u2022 ${procurementShopFeeTotalChange}`;

    return (
        <ReviewCard
            changeRequestId={changeRequestId}
            agreementId={agreementId}
            requesterName={requesterName}
            requestDate={requestDate}
            type={CHANGE_REQUEST_TYPES.BUDGET}
            actionIcons={true}
            handleReviewChangeRequest={handleReviewChangeRequest}
            changeMsg={changeMsg}
        >
            <TermTag
                label="Change To"
                value={["Procurement Shop", "Fee Rate", "Fee Total"]}
                className="grid-col-2 margin-left-2"
            />
            <TermTag
                label="From"
                value={oldValues}
                className="grid-col-2"
            />
            <TermTag
                label="To"
                value={newValues}
                className="grid-col-2 margin-left-neg-2"
            />
        </ReviewCard>
    );
}

export default ProcurementShopReviewCard;
