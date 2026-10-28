import { Link, useMatches } from "react-router-dom";
import PropTypes from "prop-types";
import { buildTrailState, resourceBasePath, truncateCrumbLabel } from "../../../helpers/breadcrumb.helpers";
import { useBreadcrumbTrail } from "../../../hooks/useBreadcrumbTrail.hooks";

/**
 * A link to an intermediate crumb. Its visible text is shortened to keep the
 * breadcrumb on one line (see `truncateCrumbLabel`); when shortened, the full
 * label stays available as its hover title and, through screen-reader-only
 * text, its accessible name. (An `aria-label` would fail axe's
 * label-content-name-mismatch rule: the visible "…" isn't part of the full name.)
 *
 * @param {Object} props
 * @param {string} props.label - The full crumb label.
 * @param {string} props.to - The path the crumb links to.
 * @param {Object} [props.state] - Location state passed to the link.
 * @returns {React.JSX.Element}
 */
const CrumbLink = ({ label, to, state }) => {
    const text = truncateCrumbLabel(label);
    const isTruncated = text !== label;
    return (
        <Link
            to={to}
            state={state}
            className="text-primary"
            title={isTruncated ? label : undefined}
        >
            {isTruncated ? (
                <>
                    <span aria-hidden="true">{text}</span>
                    <span className="usa-sr-only">{label}</span>
                </>
            ) : (
                label
            )}
        </Link>
    );
};

CrumbLink.propTypes = {
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    state: PropTypes.object
};

/**
 * Breadcrumb component
 *
 * Renders a context-aware trail when the current location carries a trail that
 * applies to it (i.e. the user drilled in via a known navigation path);
 * otherwise falls back to the canonical route hierarchy derived from React
 * Router `handle.crumb` functions. `Home` is always rendered, and the leaf
 * `currentName` (marked as the current page) whenever it isn't empty; it is
 * empty while the page's name loads.
 *
 * Each trail crumb carries the crumbs before it as its own trail, so going
 * back to an ancestor keeps that ancestor's context (e.g. clicking "CAN 1" in
 * "Portfolios > Portfolio A > CAN 1 > Agreement" shows "Portfolios > Portfolio A > CAN 1").
 *
 * The breadcrumb stays on one line: carried crumbs are shortened (see
 * `CrumbLink`), and the leaf is shown in full unless the line runs out of
 * room, where the USWDS list styles clip it with an ellipsis.
 *
 * A page that belongs to another resource (e.g. an agreement's Change BL Status
 * page) passes that resource as `parentCrumb`. It is rendered just before the
 * leaf unless the trail already ends with that resource, so the page reads
 * "… > <agreement> > Change BL Status" however the user got there.
 *
 * @param {Object} props - Properties passed to component
 * @param {string} props.currentName - The name of the current (leaf) breadcrumb; "" while it loads
 * @param {import("../../../helpers/breadcrumb.helpers").BreadcrumbAncestor} [props.parentCrumb] - The resource the current page belongs to
 * @returns {React.JSX.Element} - The rendered component
 */
const Breadcrumb = ({ currentName, parentCrumb }) => {
    const trail = useBreadcrumbTrail();
    const matches = useMatches();

    let intermediateCrumbs;
    if (trail) {
        // Context-aware trail: render the carried ancestors as links.
        intermediateCrumbs = trail.ancestors.map((ancestor, index) => (
            <CrumbLink
                key={index}
                label={ancestor.label}
                to={ancestor.to}
                state={
                    index > 0
                        ? buildTrailState(ancestor.to, trail.ancestors.slice(0, index), ancestor.label)
                        : undefined
                }
            />
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

    const ancestors = trail?.ancestors ?? [];
    const trailEndsWithParent =
        parentCrumb &&
        ancestors.length > 0 &&
        resourceBasePath(ancestors.at(-1).to) === resourceBasePath(parentCrumb.to);
    if (parentCrumb && !trailEndsWithParent) {
        intermediateCrumbs.push(
            <CrumbLink
                label={parentCrumb.label}
                to={parentCrumb.to}
                state={buildTrailState(parentCrumb.to, ancestors, parentCrumb.label)}
            />
        );
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
                    {currentName && (
                        <li
                            className="usa-breadcrumb__list-item"
                            aria-current="page"
                        >
                            {currentName}
                        </li>
                    )}
                </ol>
            </nav>
        </section>
    );
};

Breadcrumb.propTypes = {
    currentName: PropTypes.string.isRequired,
    parentCrumb: PropTypes.shape({
        label: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired
    })
};

export default Breadcrumb;
