import { Link } from "react-router-dom";

export const Menu = () => {
    return (
        <div id="nav-menu">
            <button type="button" className="usa-nav__close">
                <img src="/assets/img/usa-icons/close.svg" alt="Close" />
            </button>
            <ul className="usa-nav__primary usa-accordion">
                <li className="usa-nav__primary-item">
                    <button
                        type="button"
                        className="usa-accordion__button usa-nav__link usa-current"
                        aria-expanded="false"
                        aria-controls="extended-nav-section-one"
                    >
                        <span>Section</span>
                    </button>
                    <ul id="extended-nav-section-one" className="usa-nav__submenu">
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li className="usa-nav__primary-item">
                    <button
                        type="button"
                        className="usa-accordion__button usa-nav__link"
                        aria-expanded="false"
                        aria-controls="extended-nav-section-two"
                    >
                        <span>Section</span>
                    </button>
                    <ul id="extended-nav-section-two" className="usa-nav__submenu">
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                        <li className="usa-nav__submenu-item">
                            <a href="#top">
                                <span>&lt;Navigation link&gt;</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/portfolios">/portfolios</Link>
                </li>
                <li className="usa-nav__primary-item">
                    <Link to="/cans">/cans</Link>
                </li>
            </ul>
        </div>
    );
};
