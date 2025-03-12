import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export const Menu = () => {
    const activeUser = useSelector((state) => state.auth.activeUser);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const isUserAdmin = activeUser?.roles.includes("USER_ADMIN");

    return (
        <div id="nav-menu">
            <button
                type="button"
                className="usa-nav__close"
            >
                <img
                    src="/assets/img/usa-icons/close.svg"
                    alt="Close"
                />
            </button>
            <ul className="usa-nav__primary usa-accordion">
                <li className="usa-nav__primary-item">
                    <Link to="/portfolios/">Portfolios</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/cans/">CANs</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/agreements">Agreements</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/budget-lines">Budget Lines</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/help-center">Help Center</Link>
                </li>
                {isUserAdmin && (
                    <li className="usa-nav__primary-item">
                        <Link to="/user-admin">User Admin</Link>
                    </li>
                )}
                <li className="usa-nav__primary-item margin-left-auto">
                    <button
                        type="button"
                        className="usa-accordion__button usa-nav__link"
                        aria-expanded={isMenuOpen}
                        aria-controls="basic-mega-nav-section-two"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <span>Create</span>
                    </button>
                    <ul
                        id="basic-mega-nav-section-two"
                        className="usa-nav__submenu"
                        style={{ display: isMenuOpen ? "block" : "none" }}
                    >
                        <li className="usa-nav__submenu-item">
                            <Link to="/projects/create">Project</Link>
                            <Link to="/agreements/create">Agreement</Link>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    );
};
