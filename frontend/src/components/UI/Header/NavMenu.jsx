import React from "react";
import { useSelector } from "react-redux";
import { NavLink, useLocation } from "react-router-dom";
import { IS_PROJECTS_LIST_READY } from "../../../constants";
import { USER_ROLES } from "../../Users/User.constants";
import Tooltip from "../USWDS/Tooltip";

const PROCUREMENT_DASHBOARD_ROLES = [
    USER_ROLES.PROCUREMENT_TEAM,
    USER_ROLES.BUDGET_TEAM,
    USER_ROLES.REVIEWER_APPROVER,
    USER_ROLES.SUPER_USER
];

const NavMenu = () => {
    const activeUser = useSelector((state) => state.auth?.activeUser);
    const isUserAdmin = activeUser?.roles?.some((role) => role?.name === "USER_ADMIN");
    const hasProcurementAccess = activeUser?.roles?.some((role) => PROCUREMENT_DASHBOARD_ROLES.includes(role?.name));

    const [isMenuOpen, setIsMenuOpen] = React.useState(null);
    const location = useLocation();
    /**
     * Returns the CSS class for a NavLink based on its active state
     * @param {Object} params - The parameters object
     * @param {boolean} params.isActive - Whether the link is active
     * @param {string} pathname - The current pathname for custom logic
     * @returns {string} The CSS class name
     */

    const getNavLinkClass = ({ isActive }, pathname = null) => {
        // Custom logic for Home route to include child routes
        if (
            pathname === "/" &&
            (location.pathname === "/" || location.pathname === "/release-notes" || location.pathname === "/next")
        ) {
            return "usa-current";
        }
        return isActive ? "usa-current" : "";
    };

    return (
        <div id="nav-menu">
            <ul className="usa-nav__primary usa-accordion">
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/"
                        className={(props) => getNavLinkClass(props, "/")}
                    >
                        Home
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/portfolios"
                        className={getNavLinkClass}
                        end
                    >
                        Portfolios
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <NavLink
                        to="/projects"
                        className={getNavLinkClass}
                        end
                    >
                        Projects
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
                        end
                    >
                        CANs
                    </NavLink>
                </li>
                <li className="usa-nav__primary-item">
                    <button
                        type="button"
                        className="usa-accordion__button usa-nav__link"
                        aria-expanded={isMenuOpen === "reporting"}
                        aria-controls="reporting-nav-section"
                        onClick={() => setIsMenuOpen(isMenuOpen === "reporting" ? null : "reporting")}
                    >
                        <span>Reporting</span>
                    </button>
                    <ul
                        id="reporting-nav-section"
                        className="usa-nav__submenu"
                        style={{ display: isMenuOpen === "reporting" ? "block" : "none" }}
                    >
                        <li className="usa-nav__submenu-item">
                            <NavLink to="/reporting">OPRE Budget Reporting</NavLink>
                        </li>
                        {hasProcurementAccess && (
                            <li className="usa-nav__submenu-item">
                                <NavLink to="/procurement-dashboard">Procurement Dashboard</NavLink>
                            </li>
                        )}
                    </ul>
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
                        aria-expanded={isMenuOpen === "create"}
                        aria-controls="basic-mega-nav-section-two"
                        onClick={() => setIsMenuOpen(isMenuOpen === "create" ? null : "create")}
                    >
                        <span>Create</span>
                    </button>
                    <ul
                        id="basic-mega-nav-section-two"
                        className="usa-nav__submenu"
                        style={{ display: isMenuOpen === "create" ? "block" : "none" }}
                    >
                        <li className="usa-nav__submenu-item">
                            <NavLink to="/projects/create">Project</NavLink>
                        </li>
                        <li className="usa-nav__submenu-item">
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

export default NavMenu;
