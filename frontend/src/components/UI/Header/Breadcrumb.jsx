import { Link } from "react-router-dom";
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
