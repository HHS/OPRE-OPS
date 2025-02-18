import { useOutletContext } from "react-router-dom";

import CanCard from "../../CANs/CanCard/CanCard";
import DebugCode from "../../DebugCode";

const PortfolioFunding = () => {
    const { fiscalYear, canIds } = useOutletContext();

    return (
        <>
            <section>
                <h2 className="font-sans-lg">Portfolio Funding Summary</h2>
                <p className="font-sans-sm">
                    The summary below shows the funding for this Portfolio’s CANs for the selected fiscal year.
                </p>

                {/* <div className="display-flex flex-justify">
                    <ResearchBudgetVsSpending portfolioId={portfolioId} />
                    <ProjectsAndAgreements
                        portfolioId={portfolioId}
                        numberOfProjects={numberOfProjects}
                        numOfResearchProjects={filteredResearchProjects.length}
                        numOfAdminAndSupportProjects={filteredAdminAndSupportProjects.length}
                    />
                </div> */}
            </section>
            <section>
                <h2 className="font-sans-lg">Portfolio Budget by CAN </h2>
                <p className="font-sans-sm">
                    The summary below shows the funding for this Portfolio’s CANs for the selected fiscal year. Received
                    means the funding has been received by OPRE. Spending equals the sum of Budget Lines in Planned,
                    Executing and Obligated Status.
                </p>
                {canIds.map((canId) => (
                    <CanCard
                        key={canId}
                        canId={canId}
                        fiscalYear={fiscalYear}
                    />
                ))}
            </section>
            <DebugCode
                title="Portfolio Funding"
                data={{ canIds }}
            />
        </>
    );
};

export default PortfolioFunding;
