import { Link, useMatches } from "react-router-dom";
import style from "./Breadcrumbs.module.css";

export const BreadcrumbList = ({ isCurrent, children }) => {
    return (
        <section>
            <nav
                className="usa-breadcrumb margin-left-2 margin-right-2 padding-top-4 padding-bottom-4"
                aria-label="Breadcrumbs,,"
            >
                <ol className="usa-breadcrumb__list">
                    <li className="usa-breadcrumb__list-item" aria-current={isCurrent ? "page" : undefined}>
                        <Link to="/" className={`usa-breadbrumb__link ${style.usaBreadcrumbVisited}`}>
                            Home
                        </Link>
                    </li>
                    {children}
                </ol>
            </nav>
        </section>
    );
};

export const BreadcrumbItem = ({ pageName, isCurrent }) => {
    return (
        <li className="usa-breadcrumb__list-item" aria-label={pageName} aria-current={isCurrent ? "page" : undefined}>
            <Link to="/portfolios" className={`usa-breadbrumb__link ${style.usaBreadcrumbVisited}`}>
                {pageName}
            </Link>
        </li>
    );
};

export const Breadcrumb = () => {
    let matches = useMatches();
    let crumbs = matches
        // first get rid of any matches that don't have handle and crumb
        .filter((match) => Boolean(match.handle?.crumb))
        // now map them into an array of elements, passing the loader
        // data to each one
        .map((match) => match.handle.crumb(match.data));

    return (
        <ol>
            <li>
                <Link to="/">Home</Link>
            </li>
            {crumbs.map((crumb, index) => (
                <li key={index}>{crumb}</li>
            ))}
        </ol>
    );
};
