import DebugCode from "../../../components/DebugCode";
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

            {latestRelease.changes.map((change) => (
                <ReleaseNote
                    key={change.id}
                    subject={change.subject}
                    type={change.type}
                    description={change.description}
                />
            ))}

            <DebugCode data={prevReleases} />
        </>
    );
};

export default ReleaseNotes;
