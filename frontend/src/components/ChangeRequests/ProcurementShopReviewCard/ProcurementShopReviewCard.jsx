import { useGetAgreementByIdQuery, useGetProcurementShopsQuery } from "../../../api/opsAPI";
import { NO_DATA } from "../../../constants";
import { calculateTotal } from "../../../helpers/agreement.helpers.js";
import { convertToCurrency } from "../../../helpers/utils";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants.js";
import ReviewCard from "../ReviewCard";
import TermTag from "../TermTag";

/**
 * @component - ProcurementShopReviewCard
 * @param {Object} props
 * @param {number} props.changeRequestId
 * @param {number} props.agreementId
 * @param {string} props.requesterName
 * @param {string} props.requestDate
 * @param {Function} props.handleReviewChangeRequest
 * @param {number} props.oldAwardingEntityId
 * @param {number} props.newAwardingEntityId
 * @param {boolean} [props.isCondensed=false]
 * @param {boolean} [props.forceHover=false]
 * @returns {React.ReactElement}
 */
function ProcurementShopReviewCard({
    changeRequestId,
    agreementId,
    requesterName,
    requestDate,
    handleReviewChangeRequest,
    oldAwardingEntityId,
    newAwardingEntityId,
    isCondensed = false,
    forceHover = false
}) {
    const { data: procurementShops, isLoading: isGetProcurementShopLoading } = useGetProcurementShopsQuery({});
    const oldAwardingEntity = procurementShops?.find((shop) => shop.id === oldAwardingEntityId);
    const newAwardingEntity = procurementShops?.find((shop) => shop.id === newAwardingEntityId);
    const { data: agreementData, isLoading: isLoadingAgreementData } = useGetAgreementByIdQuery(agreementId);

    if (isGetProcurementShopLoading || isLoadingAgreementData) {
        return <h1>Loading...</h1>;
    }

    const oldTotal = calculateTotal(
        agreementData?.budget_line_items ?? [],
        oldAwardingEntity?.fee_percentage ?? 0
    );

    const newTotal = calculateTotal(
        agreementData?.budget_line_items ?? [],
        newAwardingEntity?.fee_percentage ?? 0
    );

    const oldValues = [
        oldAwardingEntity ? oldAwardingEntity.abbr : NO_DATA,
        oldAwardingEntity?.fee_percentage !== undefined ? `${oldAwardingEntity?.fee_percentage}%` : NO_DATA,
        convertToCurrency(oldTotal)
    ];

    const newValues = [
        newAwardingEntity ? newAwardingEntity.abbr : NO_DATA,
        newAwardingEntity?.fee_percentage !== undefined ? `${newAwardingEntity?.fee_percentage}%` : NO_DATA,
        convertToCurrency(newTotal)
    ];

    const procurementShopNameChange = `Procurement Shop: ${oldAwardingEntity?.name} (${oldAwardingEntity?.abbr}) to ${newAwardingEntity?.name} (${newAwardingEntity?.abbr})`;
    const procurementFeePercentageChange = `Fee Rate: ${oldAwardingEntity?.fee_percentage}% to ${newAwardingEntity?.fee_percentage}%`;
    const procurementShopFeeTotalChange = `Fee Total: ${convertToCurrency(oldTotal)} to ${convertToCurrency(newTotal)}`;
    const changeMsg = `\u2022 ${procurementShopNameChange}<br>\u2022 ${procurementFeePercentageChange}<br>\u2022 ${procurementShopFeeTotalChange}`;

    return (
        <ReviewCard
            changeRequestId={changeRequestId}
            agreementId={agreementId}
            requesterName={requesterName}
            requestDate={requestDate}
            type={CHANGE_REQUEST_TYPES.PROCUREMENT_SHOP}
            actionIcons={true}
            handleReviewChangeRequest={handleReviewChangeRequest}
            changeMsg={changeMsg}
            isCondensed={isCondensed}
            forceHover={forceHover}
            wrapperStyles={{ justifyContent: "initial" }}
        >
            <TermTag
                label="Change To"
                value={["Procurement Shop", "Fee Rate", "Fee Total"]}
                className="grid-col-2"
            />
            <TermTag
                label="From"
                value={oldValues}
                className="grid-col-1 margin-left-8"
            />
            <TermTag
                label="To"
                value={newValues}
                className="grid-col-1 margin-left-8"
            />
        </ReviewCard>
    );
}

export default ProcurementShopReviewCard;
