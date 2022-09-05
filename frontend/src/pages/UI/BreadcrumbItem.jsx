import { Link } from "react-router-dom";

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

export default BreadcrumbItem;
