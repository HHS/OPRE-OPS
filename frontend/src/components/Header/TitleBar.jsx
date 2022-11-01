import AuthSection from "../Auth/AuthSection";
import { Menu } from "./Menu";
import { Search } from "./Search";

export const TitleBar = () => {
    return (
        <div className="usa-navbar">
            <div className="usa-logo" id="-logo">
                <img src="OPRE_Logo.png" alt="OPRE Logo" />
                <em className="usa-logo__text">
                    <a href="/" title="Portfolio Management System">
                        Portfolio Management System
                    </a>
                </em>
            </div>
            <div className="usa-nav__secondary">
                <AuthSection />
                <Search />
            </div>
            <Menu />
        </div>
    );
};
