import { Link } from "react-router-dom";

const Breadcrumb = (props) => {
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

export default Breadcrumb;
