import { Outlet } from "react-router-dom";
import Tabs from "../../components/UI/Tabs";
import CurrentlyDevelopingCard from "./CurrentlyDevelopingCard";
import { HOME_RELATIVE_PATHS } from "./homeRoutes";
import ReleaseNotesSummaryCard from "./release-notes/ReleaseNotesSummaryCard";
import useWelcomeMessage from "./useWelcomeMessage";

/**
 * @component - Layout for the redesigned homepage: a personalized welcome message,
 * the "OPS Updates" summary cards, and the tabbed nav (What's New, OPS at a Glance,
 * OPS Benefits). Rendered as a pathless layout route nested under Home, so the welcome
 * message/cards/tab nav persist across tab switches while the active tab's content
 * renders via Outlet.
 * @returns {React.ReactElement}
 */
const HomeLanding = () => {
    const { greeting } = useWelcomeMessage();
    return (
        <>
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
            <Tabs
                paths={[
                    { pathName: `/${HOME_RELATIVE_PATHS.whatsNew}`, label: "What's New" },
                    { pathName: `/${HOME_RELATIVE_PATHS.opsAtAGlance}`, label: "OPS at a Glance" },
                    { pathName: `/${HOME_RELATIVE_PATHS.opsBenefits}`, label: "OPS Benefits" }
                ]}
                scrollToTopOnChange
            />
            <Outlet />
        </>
    );
};

export default HomeLanding;
