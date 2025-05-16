import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import ErrorPage from "../../../pages/ErrorPage";
import BudgetCard from "../../UI/Cards/BudgetCard";

/**  @typedef {import("../../../types/CANTypes").CAN} CAN */
/**
 * @typedef {Object} CANFundingCardProps
 * @property {CAN} can - The CAN object.
 * @property {number} pendingAmount - The pending amount.
 * @property {boolean} afterApproval - A flag indicating whether the funding is after approval.
 */
/**
 * @component - displays funding information for a CAN in a card format
 * @param {CANFundingCardProps} props - The component props.
 * @returns {React.ReactElement} - The CANFundingCard component.
 */
const CANFundingCard = ({ can, pendingAmount, afterApproval }) => {
    const adjustAmount = afterApproval ? pendingAmount : 0;
    const canId = can?.id;
    /** @type {{data?: import("../../../types/CANTypes").FundingSummary | undefined, error?: Object, isLoading: boolean}} */
    const { data, error, isLoading } = useGetCanFundingSummaryQuery({ ids: [canId] });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <ErrorPage />;
    }

    const title = `${data?.cans?.[0]?.can?.number}-${data?.cans?.[0]?.can?.active_period}Y`;
    const totalFunding = Number(data?.total_funding);
    const availableFunding = Number(data?.available_funding);
    const totalAccountedFor = totalFunding - availableFunding; // same as adding planned, obligated, in_execution
    const totalSpending = totalAccountedFor + adjustAmount;

    return (
        <BudgetCard
            cardId={canId}
            title={`${title} \n CAN Available Budget`}
            totalSpending={totalSpending}
            totalFunding={totalFunding}
        />
    );
};
export default CANFundingCard;
