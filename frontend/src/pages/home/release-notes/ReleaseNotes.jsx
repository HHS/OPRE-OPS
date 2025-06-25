import DebugCode from "../../../components/DebugCode";
import Tag from "../../../components/UI/Tag";
import { data } from "./data";

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
                // NOTE: make this into a component
                <article
                    className="margin-bottom-2"
                    key={change.id}
                >
                    <div className="display-flex flex-align-center margin-bottom-1">
                        <h3 className="margin-0">{change.subject}</h3>
                        <Tag
                            text={change.type}
                            className="margin-left-1 bg-brand-neutral-lightest text-brand-neutral-dark"
                        />
                    </div>
                    <p className="margin-0">{change.description}</p>
                </article>
            ))}

            <DebugCode data={prevReleases} />
        </>
    );
};

export default ReleaseNotes;
