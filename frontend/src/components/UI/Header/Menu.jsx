import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";
import { useRef } from "react";
export const Menu = () => {
    let isAuthorized = CheckAuth();

    useRef(() => {
        isAuthorized = CheckAuth();
    }, [isAuthorized]);

    return (
        <div id="nav-menu">
            <button type="button" className="usa-nav__close">
                <img src="/assets/img/usa-icons/close.svg" alt="Close" />
            </button>

            {isAuthorized ? (
                <ul className="usa-nav__primary usa-accordion">
                    <li className="usa-nav__primary-item">
                        <Link to="/">Home</Link>
                    </li>
                    <li className="usa-nav__primary-item">
                        <Link to="/portfolios/">Portfolios</Link>
                    </li>
                    <li className="usa-nav__primary-item">
                        <Link to="/cans/">CANs</Link>
                    </li>
                </ul>
            ) : (
                <ul className="usa-nav__primary usa-accordion">
                    <li className="usa-nav__primary-item">
                        <Link to="/">Home</Link>
                    </li>
                </ul>
            )}
        </div>
    );
};
