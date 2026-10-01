import { Outlet } from "react-router-dom";
import App from "../../App";
import Tabs from "../../components/UI/Tabs";
import { isHomepageRedesignEnabled } from "../../helpers/featureFlags";
import goldDiagonal from "../../images/gold-diagnal.png";
import ReleaseNotesSummaryCard from "./release-notes/ReleaseNotesSummaryCard";
import useWelcomeMessage from "./useWelcomeMessage";
import CurrentlyDevelopingCard from "./CurrentlyDevelopingCard";

const HomepageRedesign = () => {
    const { greeting } = useWelcomeMessage();
    return (
        <App>
            <h1
                className="margin-0 text-brand-primary font-sans-2xl margin-top-4 margin-bottom-4"
                data-cy="welcome-message"
                data-testid="welcome-message"
            >
                {greeting}! Here&apos;s the latest.
            </h1>
            <div className="display-flex flex-justify flex-align-center padding-y-1">
                <h2 className="margin-0">OPS Updates</h2>
            </div>
            <p>
                This is a bi-weekly summary of the current OPS status including what&apos;s new, what&apos;s coming up
                next, and what&apos;s available today.
            </p>
            <div
                className="display-flex"
                style={{ gap: "1.5rem" }}
            >
                <ReleaseNotesSummaryCard />
                <CurrentlyDevelopingCard />
            </div>
            <Outlet />
        </App>
    );
};

const Home = () => {
    if (isHomepageRedesignEnabled()) {
        return <HomepageRedesign />;
    }

    return (
        <App>
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
            <Tabs
                paths={[
                    {
                        pathName: "/",
                        label: "About OPS"
                    },
                    {
                        pathName: "/release-notes",
                        label: "Release Notes"
                    },
                    {
                        pathName: "/next",
                        label: "What's Next"
                    }
                ]}
            />
            <Outlet />
        </App>
    );
};

export default Home;
