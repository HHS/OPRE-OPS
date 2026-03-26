import { useNavigate } from "react-router-dom";
import { useGetCanFundingQuery } from "../../../api/opsAPI";
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
    const navigate = useNavigate();
    const adjustAmount = afterApproval ? pendingAmount : 0;
    const canId = can?.id;
    /** @type {{data?: import("../../../types/CANTypes").CANFundingResponse | undefined, error?: Object, isLoading: boolean}} */
    const { data, error, isLoading } = useGetCanFundingQuery({ id: canId });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        navigate("/error");
        return;
    }

    const title = `${data?.can?.number}-${data?.can?.active_period}Y`;
    const totalFunding = Number(data?.funding?.total_funding);
    const availableFunding = Number(data?.funding?.available_funding);
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
