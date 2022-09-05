import { Link } from "react-router-dom";

const BreadcrumbList = (props) => {
    return (
        <nav className="usa-breadcrumb" aria-label="Breadcrumbs,,">
            <ol className="usa-breadcrumb__list">
                <li className="usa-breadcrumb__list-item">
                    <Link to="/" className="usa-breadcrumb__link">
                        Home
                    </Link>
                </li>
                {props.children}
            </ol>
        </nav>
    );
};

const BreadcrumbItem = (props) => {
    return (
        <li
            className="usa-breadcrumb__list-item"
            aria-label={props.pageName}
            aria-current={props.isCurrent ? "page" : undefined}
        >
            <Link to="/portfolios" className="usa-breadcrumb__link">
                {props.pageName}
            </Link>
        </li>
    );
};

export { BreadcrumbList, BreadcrumbItem };
