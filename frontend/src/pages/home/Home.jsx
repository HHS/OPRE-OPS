import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import App from "../../App";
import PageHeader from "../../components/UI/PageHeader";
import SectionHeading from "../../components/UI/SectionHeading";
import Tabs from "../../components/UI/Tabs";
import { HOME_TABS } from "./constants";
import { getGreeting } from "./home.helpers";
import styles from "./Home.module.scss";
import PrioritiesSummaryCard from "./priorities/PrioritiesSummaryCard";
import ReleaseSummaryCard from "./release-notes/ReleaseSummaryCard";

/**
 * @component - The OPS home page shell: a greeting, release and roadmap summary cards, and in-page tabs.
 * @returns {JSX.Element} The rendered component.
 */
const Home = () => {
    const firstName = useSelector((state) => state.auth?.activeUser?.first_name);

    return (
        <App>
            <section
                id="home-summary"
                className={`bg-base-lightest padding-y-4 ${styles.summaryBand}`}
                data-cy="home-summary"
            >
                <PageHeader title={getGreeting(firstName)} />
                <SectionHeading
                    title="OPS Release Summary"
                    instructions="The summary below shows what shipped in the latest OPS release and what the team is working on next."
                />
                <div className="grid-row grid-gap-4">
                    <div className="tablet:grid-col-6 margin-bottom-2 tablet:margin-bottom-0">
                        <ReleaseSummaryCard />
                    </div>
                    <div className="tablet:grid-col-6">
                        <PrioritiesSummaryCard />
                    </div>
                </div>
            </section>
            <Tabs paths={HOME_TABS} />
            <Outlet />
        </App>
    );
};

export default Home;
