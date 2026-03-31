import CANBudgetLineTableLoading from "../../CANs/CANBudgetLineTable/CANBudgetLineTableLoading";

/**
 * Skeleton loading state for the portfolio spending budget line table.
 * @returns {React.ReactElement}
 */
const PortfolioSpendingTableLoading = () => (
    <CANBudgetLineTableLoading
        tableType="portfolio"
        ariaLabel="Loading portfolio budget lines"
    />
);

export default PortfolioSpendingTableLoading;
