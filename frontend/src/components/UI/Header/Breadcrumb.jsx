import { Link, useMatches } from "react-router-dom";
import PropTypes from "prop-types";

export const Breadcrumb = ({ currentName }) => {
    let matches = useMatches();
    let crumbs = matches
        // first get rid of any matches that don't have handle and crumb
        .filter((match) => Boolean(match.handle?.crumb))
        // now map them into an array of elements, passing the loader
        // data to each one
        .map((match) => match.handle.crumb(match.data));

    return (
        <section>
            <nav
                className="usa-breadcrumb margin-left-2 margin-right-2 padding-top-3 padding-bottom-4"
                aria-label="Breadcrumbs"
            >
                <ol className="usa-breadcrumb__list">
                    <li className="usa-breadcrumb__list-item">
                        <Link to="/" className="usa-breadbrumb__link text-primary">
                            Home
                        </Link>
                    </li>
                    {crumbs.map((crumb, index) => (
                        <li key={index} className="usa-breadcrumb__list-item">
                            {crumb}
                        </li>
                    ))}
                    <li className="usa-breadcrumb__list-item">{currentName}</li>
                </ol>
            </nav>
        </section>
    );
};

Breadcrumb.propTypes = {
    currentName: PropTypes.string.isRequired,
};

export default Breadcrumb;
