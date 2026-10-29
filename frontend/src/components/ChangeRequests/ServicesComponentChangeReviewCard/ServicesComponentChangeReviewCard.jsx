import PropTypes from "prop-types";
import { renderChangeValues } from "../../../helpers/changeRequests.helpers";
import { convertCodeForDisplay } from "../../../helpers/utils";
import { getServicesComponentChangeLines } from "../../ServicesComponents/ServicesComponents.helpers";
import { CHANGE_REQUEST_TYPES } from "../ChangeRequests.constants";
import ReviewCard from "../ReviewCard";
import TermTag from "../TermTag";

/**
 * Review card for a Services Component addition on an Awarded agreement (OPS-6440).
 * Reviewed on the budget-change surface, like BudgetChangeReviewCard.
 * @component
 * @param {Object} props - Properties passed to component
 * @param {import("../../../types/ChangeRequestsTypes").ChangeRequest} props.changeRequest - The Services Component change request
 * @param {Function} props.handleReviewChangeRequest - Function to handle review of change requests
 * @param {boolean} [props.isCondensed=false] - Whether the card is condensed
 * @param {boolean} [props.forceHover=false] - Whether to force hover state
 * @returns {JSX.Element} - The rendered component
 */
function ServicesComponentChangeReviewCard({
    changeRequest,
    handleReviewChangeRequest,
    isCondensed = false,
    forceHover = false
}) {
    const changeTo = changeRequest.requested_change_diff;
    const keyName = Object.keys(changeTo)[0];
    const { oldValue, newValue } = renderChangeValues(keyName, changeTo);
    const servicesComponentName = changeRequest.requested_change_info?.target_display_name ?? oldValue ?? newValue;
    const budgetLineIds = changeRequest.requested_change_info?.linked_budget_line_item_ids ?? [];
    const changeMsg = getServicesComponentChangeLines(changeRequest)
        .map((line) => `• ${line}`)
        .join("\n");

    return (
        <ReviewCard
            changeRequestId={changeRequest.id}
            type={CHANGE_REQUEST_TYPES.BUDGET}
            agreementId={changeRequest.agreement_id}
            actionIcons={true}
            requesterName={changeRequest.created_by_user?.display_name ?? changeRequest.created_by_user?.full_name}
            requestDate={changeRequest.created_on}
            handleReviewChangeRequest={handleReviewChangeRequest}
            changeMsg={changeMsg}
            isCondensed={isCondensed}
            forceHover={forceHover}
        >
            <TermTag
                label="SC"
                value={servicesComponentName}
                className="grid-col-1"
            />
            <TermTag
                label="Change To"
                value={convertCodeForDisplay("changeToTypes", keyName)}
                className="grid-col-3"
            />
            <TermTag
                label="Budget Lines"
                value={budgetLineIds.length > 0 ? budgetLineIds.map(String) : "None"}
                className="grid-col-2"
            />
            <TermTag
                label="From"
                value={oldValue}
                className="grid-col-2"
            />
            <TermTag
                label="To"
                value={newValue}
                className="grid-col-2 margin-left-neg-2"
            />
        </ReviewCard>
    );
}

ServicesComponentChangeReviewCard.propTypes = {
    changeRequest: PropTypes.object.isRequired,
    handleReviewChangeRequest: PropTypes.func.isRequired,
    isCondensed: PropTypes.bool,
    forceHover: PropTypes.bool
};
export default ServicesComponentChangeReviewCard;
