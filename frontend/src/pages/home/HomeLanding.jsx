import CurrentlyDevelopingCard from "./CurrentlyDevelopingCard";
import ReleaseNotesSummaryCard from "./release-notes/ReleaseNotesSummaryCard";
import useWelcomeMessage from "./useWelcomeMessage";

/**
 * @component - Redesigned homepage landing content (feature-flagged): a personalized
 * welcome message plus the "OPS Updates" summary cards. Rendered as the index route
 * under the Home layout, so child routes (/release-notes, /next) are unaffected.
 * @returns {React.ReactElement} The rendered homepage landing content.
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
        </>
    );
};

export default HomeLanding;
