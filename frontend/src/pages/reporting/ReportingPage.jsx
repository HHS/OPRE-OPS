import App from "../../App";

const ReportingPage = () => {
    return (
        <App breadCrumbName="OPRE Budget Reporting">
            <h1 className="margin-0 margin-bottom-2 text-brand-primary font-sans-2xl">OPRE Budget Reporting</h1>
            <p className="margin-top-0">All Portfolios</p>
            <h2 className="margin-bottom-1">Budget Summary</h2>
            <p>This is a summary of OPRE&apos;s budget for the selected FY and applied filters.</p>
        </App>
    );
};

export default ReportingPage;
