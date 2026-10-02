import HoverCard from "../../components/UI/Cards/HoverCard";
import approvalIcon from "../../images/approvals.svg";
import autonomyIcon from "../../images/autonomy.svg";
import dataVisualizationIcon from "../../images/data-viz.svg";
import realTimePlanningIcon from "../../images/planning.svg";
import transparencyIcon from "../../images/transparency.svg";

/**
 * @component - Renders the grid of OPS benefit cards. Shared by the legacy
 * centered-header "About OPS" tab and the redesigned "OPS Benefits" tab.
 * @returns {React.ReactElement}
 */
const BenefitsCardsGrid = () => (
    <>
        <section className="usa-card-group">
            <HoverCard
                title="Transparency"
                description="View high-level budget, spending, and research data for each Portfolio, along with funding details for every CAN. Track changes via history to see who changed what and when"
                variant="dark"
                icon={transparencyIcon}
            />
            <HoverCard
                title="Data visualization"
                description="Budget and spending data can be viewed in more diverse and customized ways like across a portfolio, project, CAN, or agreement"
                variant="light"
                icon={dataVisualizationIcon}
            />
            <HoverCard
                title="Autonomy"
                description="It's your data, your way. Team Members can edit and update their own agreements without having to wait for someone else to do it for them"
                variant="dark"
                icon={autonomyIcon}
            />
        </section>
        <section className="usa-card-group display-flex flex-justify-center">
            <HoverCard
                title="Built-in approvals"
                description="More people are able to edit directly while still maintaining necessary oversight on the budget. You can track approvals in OPS instead of over email"
                variant="light"
                icon={approvalIcon}
            />
            <HoverCard
                title="Real-time planning"
                description="You don't need to wait until you're 100% sure. Plans can be entered into the system as drafts providing a more holistic view of planning across all stages"
                variant="dark"
                icon={realTimePlanningIcon}
            />
        </section>
    </>
);

export default BenefitsCardsGrid;
