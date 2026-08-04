import { Link, useLocation, useMatches } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { trailMatchesPath } from "../../../helpers/breadcrumb.helpers";

/**
 * Breadcrumb component
 *
 * Renders a context-aware trail when a stored nav-context trail applies to the
 * current location (i.e. the user drilled in via a known navigation path);
 * otherwise falls back to the canonical route hierarchy derived from React
 * Router `handle.crumb` functions. `Home` and the leaf `currentName` are always
 * rendered.
 *
 * @param {Object} props - Properties passed to component
 * @param {string} props.currentName - The name of the current (leaf) breadcrumb
 * @returns {React.JSX.Element} - The rendered component
 */
const Breadcrumb = ({ currentName }) => {
    const { pathname } = useLocation();
    const trail = useSelector((state) => state.sessionUI?.navContext?.trail);
    const matches = useMatches();

    const useStoredTrail = trailMatchesPath(trail, pathname);

    let intermediateCrumbs;
    if (useStoredTrail) {
        // Context-aware trail: render the stored ancestors as links.
        intermediateCrumbs = trail.ancestors.map((ancestor, index) => (
            <Link
                key={index}
                to={ancestor.to}
                className="text-primary"
            >
                {ancestor.label}
            </Link>
        ));
    } else {
        // Fallback: canonical route hierarchy from `handle.crumb`.
        intermediateCrumbs = matches
            // first get rid of any matches that don't have handle and crumb
            .filter((match) => Boolean(match.handle?.crumb))
            // now map them into an array of elements, passing the loader
            // data to each one
            .map((match) => match.handle.crumb(match.data));
    }

    return (
        <section className="bg-white">
            <nav
                className="usa-breadcrumb margin-right-2 padding-y-105"
                aria-label="Breadcrumbs"
            >
                <ol className="usa-breadcrumb__list">
                    <li className="usa-breadcrumb__list-item">
                        <Link
                            to="/"
                            className="usa-breadcrumb__link text-primary"
                        >
                            Home
                        </Link>
                    </li>
                    {intermediateCrumbs.map((crumb, index) => (
                        <li
                            key={index}
                            className="usa-breadcrumb__list-item"
                        >
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
    currentName: PropTypes.string.isRequired
};

export default Breadcrumb;
