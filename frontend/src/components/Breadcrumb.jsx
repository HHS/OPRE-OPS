import { Link } from "react-router-dom";

export const BreadcrumbList = ({ isCurrent, children }) => {
    return (
        <nav className="usa-breadcrumb" aria-label="Breadcrumbs,,">
            <ol className="usa-breadcrumb__list">
                <li className="usa-breadcrumb__list-item" aria-current={isCurrent ? "page" : undefined}>
                    <Link to="/" className="usa-breadcrumb__link">
                        Home
                    </Link>
                </li>
                {children}
            </ol>
        </nav>
    );
};

export const BreadcrumbItem = ({ pageName, isCurrent }) => {
    return (
        <li className="usa-breadcrumb__list-item" aria-label={pageName} aria-current={isCurrent ? "page" : undefined}>
            <Link to="/portfolios" className="usa-breadcrumb__link">
                {pageName}
            </Link>
        </li>
    );
};
