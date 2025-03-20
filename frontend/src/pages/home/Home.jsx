import App from "../../App";
import SimpleAlert from "../../components/UI/Alert/SimpleAlert";
import HoverCard from "../../components/UI/Cards/HoverCard";
import approvalIcon from "../../images/approvals.svg";
import autonomyIcon from "../../images/autonomy.svg";
import dataVisualizationIcon from "../../images/data-viz.svg";
import flourish from "../../images/flourish.svg";
import goldDiagonal from "../../images/gold-diagnal.png";
import realTimePlanningIcon from "../../images/planning.svg";
import transparencyIcon from "../../images/transparency.svg";

const Home = () => {
    return (
        <App>
            {!import.meta.env.PROD && (
                <SimpleAlert
                    type="warning"
                    heading="This is a non-production OPS environment"
                    message="This environment is not authorized for certain production datasets. Additionally, this environment may be updated regularly."
                />
            )}
            <>
                <section
                    id="hero"
                    className="text-center bg-base-light padding-x-4 padding-y-6"
                    style={{
                        marginLeft: "calc(-2rem)",
                        marginRight: "calc(-2rem)",
                        width: "calc(100% + 4rem)",
                        backgroundImage: `url(${goldDiagonal})`,
                        backgroundRepeat: "repeat",
                        backgroundSize: "8px"
                    }}
                >
                    <h1
                        className="margin-0 text-brand-primary"
                        style={{ fontSize: "4rem" }}
                    >
                        Plan, track & collaborate
                    </h1>
                    <p
                        className="text-brand-primary margin-0 margin-top-1"
                        style={{ fontSize: "2rem" }}
                    >
                        all in one place
                    </p>
                    <p
                        className="margin-0 margin-top-4 margin-x-auto"
                        style={{ width: "612px", fontSize: "1.375rem" }}
                    >
                        OPS brings everyone together for transparent and collaborative budget planning and tracking
                    </p>
                </section>
                <section
                    id="divider"
                    className="display-flex flex-column flex-align-center margin-bottom-4"
                >
                    <h2 className="text-brand-primary font-32px">OPS Benefits</h2>
                    <img
                        src={flourish}
                        alt="flourish"
                        width="94px"
                    />
                </section>
                <section className="usa-card-group">
                    <HoverCard
                        title="Transparency"
                        description="Everyone can view everything and changes are tracked in the history so you can easily understand who changed what and when"
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
        </App>
    );
};

export default Home;
