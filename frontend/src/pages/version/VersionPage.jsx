import packageJson from "../../../package.json";

const VersionPage = () => {
    return (
        <div>
            <h1>Version: {packageJson.version}</h1>
        </div>
    );
};

export default VersionPage;
