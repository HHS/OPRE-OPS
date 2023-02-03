import PortfolioBudgetSummary from "../PortfolioBudgetSummary/PortfolioBudgetSummary";
import { useOutletContext } from "react-router-dom";

const BudgetAndFunding = () => {
    const [portfolioId, canCards] = useOutletContext();

    return (
        <div>
            <section>
                <PortfolioBudgetSummary portfolioId={portfolioId} />
            </section>
            <section>
                <h2>Portfolio Budget Details by CAN </h2>
                <p>
                    The list of CANs below are specific to this portfolio’s budget. It does not include funding from
                    other CANs outside of this portfolio that might occur during cross-portfolio collaborations on
                    research projects.
                </p>
                {canCards.length ? canCards : <span>No CANs to display.</span>}
            </section>
        </div>
    );
};

export default BudgetAndFunding;
