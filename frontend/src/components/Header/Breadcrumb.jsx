import { Link } from "react-router-dom";

import style from "./styles.module.css";

export const BreadcrumbList = ({ isCurrent, children }) => {
    return (
        <section className={style.navSection}>
            <nav className="usa-breadcrumb margin-left-2 margin-right-2" aria-label="Breadcrumbs,,">
                <ol className="usa-breadcrumb__list">
                    <li className="usa-breadcrumb__list-item" aria-current={isCurrent ? "page" : undefined}>
                        <Link to="/" className="usa-breadcrumb__link">
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
            <Link to="/portfolios" className="usa-breadcrumb__link">
                {pageName}
            </Link>
        </li>
    );
};
