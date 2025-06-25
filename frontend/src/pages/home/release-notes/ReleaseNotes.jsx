import Accordion from "../../../components/UI/Accordion";
import { formatDateToMonthDayYear } from "../../../helpers/utils";
import { data } from "./data";
import ReleaseNote from "./ReleaseNote";

const ReleaseNotes = () => {
    if (!data || data.length === 0) return <p>No release notes available.</p>;
    const latestRelease = data[0];
    const prevReleases = data.slice(1);

    return (
        <>
            <h1>OPS Release Summary</h1>
            {/* TODO: Cards go here */}
            <h2>Release Notes: {latestRelease.version}</h2>
            <section
                className="margin-bottom-8"
                id="latest-release-notes"
            >
                {latestRelease.changes.map((change) => (
                    <ReleaseNote
                        key={change.id}
                        subject={change.subject}
                        type={change.type}
                        description={change.description}
                    />
                ))}
            </section>

            {prevReleases.length > 0 &&
                prevReleases.map((release) => (
                    <Accordion
                        key={release.version}
                        heading={`Release Notes ${release.version} - ${formatDateToMonthDayYear(release.date)}`}
                        level={2}
                        isClosed
                    >
                        {release.changes.map((change) => (
                            <ReleaseNote
                                key={change.id}
                                subject={change.subject}
                                type={change.type}
                                description={change.description}
                            />
                        ))}
                    </Accordion>
                ))}
        </>
    );
};

export default ReleaseNotes;
