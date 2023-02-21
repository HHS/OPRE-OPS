import React from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import CurrencyFormat from "react-currency-format";
import CurrencySummaryCard from "../../UI/CurrencySummaryCard/CurrencySummaryCard";
import CANFundingBar from "../../CANs/CANFundingBar/CANFundingBar";
import { calculatePercent } from "../../../helpers/utils";
import Tag from "../../UI/Tag/Tag";
import { data } from "./data";

const ProjectsAndAgreements = ({ portfolioId = 0, numberOfProjects = 0 }) => {
    const portfolioBudget = useSelector((state) => state.portfolioBudgetSummary.portfolioBudget);
    const fiscalYear = useSelector((state) => state.portfolio.selectedFiscalYear);
    // const totalFunding = portfolioBudget.total_funding?.amount;
    const totalFunding = "10000000.00";
    const carryForwardFunding = portfolioBudget.carry_over_funding?.amount || 0;
    const newFunding = portfolioBudget.total_funding?.amount - portfolioBudget.carry_over_funding?.amount;
    const projectHeading = `FY ${fiscalYear.value} Projects`;
    const agreementHeading = `FY ${fiscalYear.value} Agreements`;

    return (
        <CurrencySummaryCard>
            <div className="display-flex flex-justify">
                <div className="section">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-darker text-normal">
                        {projectHeading}
                    </h3>
                    <div className="display-flex">
                        <h4 className="font-sans-xl text-bold">{numberOfProjects}</h4>
                        <Tag className="margin-left-1 bg-accent-cool-dark" text="3 Research" />
                    </div>
                </div>
                <div className="section">
                    <h3 className="margin-0 margin-bottom-3 font-12px text-base-darker text-normal">
                        {agreementHeading}
                    </h3>
                    <pre className="font-12px">tags go here</pre>
                </div>
            </div>
        </CurrencySummaryCard>
    );
};

export default ProjectsAndAgreements;
