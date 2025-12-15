import { Link } from "react-router-dom";
import App from "../App";
import { SUPPORT_URL } from "../constants";

/**
 * @component - Page for displaying an error message.
 * @returns {React.ReactElement} - The component JSX.
 */
const ErrorPage = () => {
    return (
        <App>
            <div className="usa-section">
                <div className="grid-container">
                    <div className="grid-row grid-gap">
                        <div className="usa-prose">
                            <h1>Something went wrong</h1>
                            <p className="usa-intro">
                                We’re sorry, something went wrong. The page you’re looking for might have been removed,
                                had its name changed, or is temporarily unavailable.
                            </p>
                            <p>
                                If you typed the URL directly, check your spelling and capitalization. Our URLs look
                                like this:
                                <strong>&lt;https://ops.opre.acf.gov/example-one&gt;</strong>.
                            </p>
                            <p>
                                Visit our <Link to="/help-center">Help Center</Link> for helpful tools and resources, or
                                contact us and we&apos;ll point you in the right direction.
                            </p>
                            <p>
                                If you continue to experience this issue, please{" "}
                                <a href={SUPPORT_URL}>submit a Budget Support Request through ORBIT.</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </App>
    );
};

export default ErrorPage;
