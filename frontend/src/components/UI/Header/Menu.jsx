import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";

export const Menu = () => {
    const isAuthorized = CheckAuth();
    return (
        <div id="nav-menu">
            <button type="button" className="usa-nav__close">
                <img src="/assets/img/usa-icons/close.svg" alt="Close" />
            </button>
            <ul className="usa-nav__primary usa-accordion">
                {isAuthorized ? (
                    <li className="usa-nav__primary-item">
                        <Link to="/portfolios/">Portfolios</Link>
                    </li>
                ) : (
                    <li>
                        <span></span>
                    </li>
                )}
                <li className="usa-nav__primary-item">
                    <Link to="/cans/">CANs</Link>
                </li>
                {/* <li className="usa-nav__primary-item">
                    <Link to="/projects/create">Create Project</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/agreements/create">Create Agreement</Link>
                </li> */}
                <li className="usa-nav__primary-item">
                    <Link to="/agreements/">Agreements</Link>
                </li>
                <li className="usa-nav__primary-item margin-left-auto">
                    <button
                        type="button"
                        className="usa-accordion__button usa-nav__link"
                        aria-expanded="false"
                        aria-controls="basic-mega-nav-section-two"
                    >
                        <span>Create</span>
                    </button>
                    <ul id="basic-mega-nav-section-two" className="usa-nav__submenu">
                        <li className="usa-nav__submenu-item">
                            <Link to="/projects/create">Project</Link>
                            <Link to="/agreements/create">Agreement</Link>
                            <Link to="/budget-lines/create">Budget Lines</Link>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    );
};
