import React from "react";

const BACKEND_DOMAIN =
    (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.REACT_APP_BACKEND_DOMAIN) ||
    import.meta.env.VITE_BACKEND_DOMAIN ||
    "https://localhost:8000";

const requestJson = async (url, options) => {
    const response = await fetch(url, options);
    const data = await response.json();
    return { status: response.status, data };
};

const ProcurementMocksDebug = () => {
    const [output, setOutput] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const runRequest = async (label, url, options) => {
        setIsLoading(true);
        try {
            const result = await requestJson(url, options);
            setOutput({ label, ...result });
        } catch (error) {
            setOutput({ label, error: String(error) });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="padding-4">
            <h1>Procurement Tracker MSW Debug</h1>
            <p>Use these buttons to hit the mocked procurement tracker endpoints.</p>
            <div className="display-flex flex-wrap">
                <button
                    className="usa-button margin-right-1 margin-bottom-1"
                    onClick={() => runRequest("List trackers", `${BACKEND_DOMAIN}/api/v1/procurement-trackers/`)}
                    disabled={isLoading}
                >
                    GET /api/v1/procurement-trackers/
                </button>
                <button
                    className="usa-button margin-right-1 margin-bottom-1"
                    onClick={() => runRequest("Get tracker 1", `${BACKEND_DOMAIN}/api/v1/procurement-trackers/1`)}
                    disabled={isLoading}
                >
                    GET /api/v1/procurement-trackers/1
                </button>
                <button
                    className="usa-button margin-right-1 margin-bottom-1"
                    onClick={() =>
                        runRequest(
                            "List steps for agreement 9",
                            `${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps?agreement_id=9`
                        )
                    }
                    disabled={isLoading}
                >
                    GET /api/v1/procurement-tracker-steps?agreement_id=9
                </button>
                <button
                    className="usa-button margin-right-1 margin-bottom-1"
                    onClick={() => runRequest("Get step 101", `${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps/101`)}
                    disabled={isLoading}
                >
                    GET /api/v1/procurement-tracker-steps/101
                </button>
                <button
                    className="usa-button margin-right-1 margin-bottom-1"
                    onClick={() =>
                        runRequest("Patch step 101", `${BACKEND_DOMAIN}/api/v1/procurement-tracker-steps/101`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "COMPLETED", notes: "Test note" })
                        })
                    }
                    disabled={isLoading}
                >
                    PATCH /api/v1/procurement-tracker-steps/101
                </button>
            </div>
            <div className="margin-top-2">
                <h2 className="margin-bottom-1">Response</h2>
                <pre className="bg-base-lightest padding-2">
                    {output ? JSON.stringify(output, null, 2) : "No requests yet."}
                </pre>
            </div>
        </div>
    );
};

export default ProcurementMocksDebug;
