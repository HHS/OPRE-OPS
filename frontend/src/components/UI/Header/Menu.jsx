import React from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";

export const Menu = () => {
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const isUserAdmin = activeUser?.roles.includes("USER_ADMIN");
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    /**
     * Returns the CSS class for a NavLink based on its active state
     * @param {Object} params - The parameters object
     * @param {boolean} params.isActive - Whether the link is active
     * @returns {string} The CSS class name
     */
    const getNavLinkClass = ({ isActive }) => (isActive ? "usa-current" : "");

    return (
        <div id="nav-menu">
            <ul className="usa-nav__primary usa-accordion">
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/"
                        className={getNavLinkClass}
                    >
                        Home
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/portfolios"
                        className={getNavLinkClass}
                    >
                        Portfolios
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/agreements"
                        className={getNavLinkClass}
                        end
                    >
                        Agreements
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/budget-lines"
                        className={getNavLinkClass}
                    >
                        Budget Lines
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/cans"
                        className={getNavLinkClass}
                    >
                        CANs
                    </NavLink>
                </li>
                {isUserAdmin && (
                    <li className="usa-nav__primary-item">
                        <NavLink
                            to="/user-admin"
                            className={getNavLinkClass}
                        >
                            User Admin
                        </NavLink>
                    </li>
                )}
                <li className="usa-nav__primary-item">
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
                            <NavLink to="/projects/create">Project</NavLink>
                            <NavLink to="/agreements/create">Agreement</NavLink>
                        </li>
                    </ul>
                </li>
                <li className="usa-nav__primary-item margin-left-auto">
                    <NavLink
                        to="/help-center/"
                        className={getNavLinkClass}
                    >
                        Help Center
                    </NavLink>
                </li>
            </ul>
        </div>
    );
};
