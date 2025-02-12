import PortfolioBudgetSummary from "../PortfolioBudgetSummary/PortfolioBudgetSummary";
import { useOutletContext } from "react-router-dom";

const BudgetAndSpending = () => {
    const [portfolioId, canCards] = useOutletContext();

    return (
        <>
            <h2 className="font-sans-lg">Portfolio Budget & Spending Summary</h2>
            <p className="font-sans-sm">
                The summary below shows the budget and spending for this Portfolio for the selected fiscal year.
            </p>
            <PortfolioBudgetSummary portfolioId={portfolioId} />
            <section>
                <h2>Portfolio Budget Details by CAN</h2>
                <p>
                    The list of CANs below are specific to this portfolio’s budget. It does not include funding from
                    other CANs outside of this portfolio that might occur during cross-portfolio collaborations on
                    research projects.
                </p>
                {canCards.length ? canCards : <span>No CANs to display.</span>}
            </section>
        </>
    );
};

export default BudgetAndSpending;
