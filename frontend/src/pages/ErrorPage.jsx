import { Link } from "react-router-dom";
import App from "../App";

/**
 * Page for displaying an error message.
 * @component
 * @returns {JSX.Element} - The component JSX.
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
                                Visit our Help Center for helpful tools and resources, or contact us and we&apos;ll
                                point you in the right direction.
                            </p>
                            <div className="margin-y-5">
                                <ul className="usa-button-group">
                                    <li className="usa-button-group__item">
                                        <Link
                                            to="/help-center/"
                                            className="usa-button"
                                        >
                                            Visit Help Center
                                        </Link>
                                    </li>
                                    <li className="usa-button-group__item">
                                        <a
                                            href="mailto:opre-ops-support@flexion.us"
                                            className="usa-button usa-button--outline"
                                        >
                                            Contact Us
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </App>
    );
};

export default ErrorPage;
