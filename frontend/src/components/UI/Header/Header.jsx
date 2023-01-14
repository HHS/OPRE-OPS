import AuthSection from "../../Auth/AuthSection";
import { Menu } from "./Menu";
import { Search } from "./Search";
import logo from "./OPRE_Logo.png";

const Header = () => {
    const styles = {
        logo: {
            maxWidth: "70%",
        },
        textlogo: {
            color: "#336A90",
        },
    };

    return (
        <header className="usa-header usa-header--extended padding-top-6">
            <div className="usa-navbar">
                <div className="usa-logo" style={styles.logo} id="-logo">
                    <a href="/" style={styles.textlogo} title="Portfolio Management System">
                        <img src={logo} alt="OPRE Logo" />
                        <em className="font-ui-md">&nbsp;Portfolio Management System</em>
                    </a>
                </div>
                <button type="button" className="usa-menu-btn">
                    Menu
                </button>
            </div>
            <nav aria-label="Primary navigation" className="usa-nav">
                <div className="usa-nav__inner">
                    <Menu />
                    <div className="usa-nav__secondary">
                        <AuthSection />
                        <Search />
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
