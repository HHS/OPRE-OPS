import { useGetCanFundingSummaryQuery } from "../../../api/opsAPI";
import BudgetCard from "../../UI/Cards/BudgetCard";
/**
 * @typedef {Object} CANFundingCardProps
 * @property {import("../../../components/CANs/CANTypes").CAN} can - The CAN object.
 * @property {number} pendingAmount - The pending amount.
 * @property {boolean} afterApproval - A flag indicating whether the funding is after approval.
 */
/**
 * @component - displays funding information for a CAN in a card format
 * @param {CANFundingCardProps} props - The component props.
 * @returns {JSX.Element} - The CANFundingCard component.
 */
const CANFundingCard = ({ can, pendingAmount, afterApproval }) => {
    const adjustAmount = afterApproval ? pendingAmount : 0;
    const canId = can?.id;
    const { data, error, isLoading } = useGetCanFundingSummaryQuery({ id: canId });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>An error occurred loading CAN funding data</div>;
    }

    const title = `${data.can.number}-${data.can.active_period}Y`;
    const totalFunding = Number(data.total_funding);
    const availableFunding = Number(data.available_funding);
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
