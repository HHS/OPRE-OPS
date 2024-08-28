import React from "react";
import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";
import { useSelector } from "react-redux";

export const Menu = () => {
    const isAuthorized = CheckAuth();
    const activeUser = useSelector((state) => state.auth.activeUser);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const isUserAdmin = activeUser?.roles.includes("USER_ADMIN");
    const isAdmin = activeUser?.roles.includes("admin");
    const isStandardUser = activeUser?.roles.includes("user");
    const isDivisionDirector = activeUser?.roles.includes("division-director");
    const isBudgetTeam = activeUser?.roles.includes("BUDGET_TEAM");


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
                <li className="usa-nav__primary-item">
                    <Link to="/agreements">Agreements</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/budget-lines">Budget Lines</Link>
                </li>
                {isUserAdmin && (
                    <li className="usa-nav__primary-item">
                        <Link to="/user-admin">User Admin</Link>
                    </li>
                )}
                {(isAdmin || isStandardUser || isDivisionDirector || isBudgetTeam) && (
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
                            {import.meta.env.DEV && <Link to="/budget-lines/create">Budget Lines</Link>}
                        </li>
                    </ul>
                </li>
                )}
            </ul>
        </div>
    );
};
