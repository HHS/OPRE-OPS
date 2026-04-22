import LineGraphWithLegendCard from "../../UI/Cards/LineGraphWithLegendCard";
import { computeDisplayPercents } from "../../../helpers/utils";

/**
 * Half-width card showing FY project funding split by carry-forward vs new funding.
 * Reuses LineGraphWithLegendCard (same pattern as PortfolioFunding).
 *
 * @component
 * @param {Object} props
 * @param {number} props.fiscalYear - Selected fiscal year
 * @param {{total: number, carry_forward_funding: number, new_funding: number}} props.fundingByCAN
 * @returns {JSX.Element}
 */
const ProjectFundingByCANCard = ({ fiscalYear, fundingByCAN = {} }) => {
    const { total = 0, carry_forward_funding = 0, new_funding = 0 } = fundingByCAN;

    const data = computeDisplayPercents([
        {
            id: 1,
            label: "Previous FYs Carry-Forward",
            value: carry_forward_funding,
            color: "var(--project-funding-carry-forward)",
            tagActiveStyle: "portfolioCarryForward"
        },
        {
            id: 2,
            label: `FY ${fiscalYear} New Funding`,
            value: new_funding,
            color: "var(--project-funding-new-funding)",
            tagActiveStyle: "portfolioNewFunding"
        }
    ]);

    return (
        <LineGraphWithLegendCard
            heading={`FY ${fiscalYear} Project Funding by CAN`}
            data={data}
            bigNumber={total}
        />
    );
};

export default ProjectFundingByCANCard;
