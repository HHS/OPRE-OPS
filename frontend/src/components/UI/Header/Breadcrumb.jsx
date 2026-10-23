import { Link, useMatches } from "react-router-dom";
import PropTypes from "prop-types";
import { buildTrailState } from "../../../helpers/breadcrumb.helpers";
import { useBreadcrumbTrail } from "../../../hooks/useBreadcrumbTrail.hooks";

/**
 * Breadcrumb component
 *
 * Renders a context-aware trail when the current location carries a trail that
 * applies to it (i.e. the user drilled in via a known navigation path);
 * otherwise falls back to the canonical route hierarchy derived from React
 * Router `handle.crumb` functions. `Home` and the leaf `currentName` are always
 * rendered.
 *
 * Each trail crumb carries the crumbs before it as its own trail, so going
 * back to an ancestor keeps that ancestor's context (e.g. clicking "CAN 1" in
 * "Portfolios > Portfolio A > CAN 1 > Agreement" shows "Portfolios > Portfolio A > CAN 1").
 *
 * @param {Object} props - Properties passed to component
 * @param {string} props.currentName - The name of the current (leaf) breadcrumb
 * @returns {React.JSX.Element} - The rendered component
 */
const Breadcrumb = ({ currentName }) => {
    const trail = useBreadcrumbTrail();
    const matches = useMatches();

    let intermediateCrumbs;
    if (trail) {
        // Context-aware trail: render the carried ancestors as links.
        intermediateCrumbs = trail.ancestors.map((ancestor, index) => (
            <Link
                key={index}
                to={ancestor.to}
                state={index > 0 ? buildTrailState(ancestor.to, trail.ancestors.slice(0, index)) : undefined}
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
