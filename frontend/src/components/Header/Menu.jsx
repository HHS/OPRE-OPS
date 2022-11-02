import { Link } from "react-router-dom";

export const Menu = () => {
    return (
        <div id="nav-menu">
            <button type="button" className="usa-nav__close">
                <img src="/assets/img/usa-icons/close.svg" alt="Close" />
            </button>
            <ul className="usa-nav__primary usa-accordion">
                <li className="usa-nav__primary-item">
                    <Link to="/portfolios">Portfolios</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/cans">CANs</Link>
                </li>
            </ul>
        </div>
    );
};
