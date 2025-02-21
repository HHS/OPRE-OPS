import { Link } from "react-router-dom";
import AuthSection from "../../Auth/AuthSection";
import { Menu } from "./Menu";
import logo from "./OPRE_Logo.png";

const Header = () => {
    const styles = {
        logo: {
            maxWidth: "70%"
        },
        textlogo: {
            color: "#336A90"
        }
    };

    return (
        <header className="usa-header usa-header--extended bg-brand-primary">
            <div className="usa-navbar padding-top-105 bg-white">
                <div
                    className="usa-logo"
                    style={styles.logo}
                    id="-logo"
                >
                    <Link
                        to="/"
                        style={styles.textlogo}
                        title="Portfolio Management System"
                    >
                        <img
                            src={logo}
                            alt="OPRE Logo"
                        />
                        <em className="font-ui-md">&nbsp;Portfolio Management System</em>
                    </Link>
                </div>
                <button
                    type="button"
                    className="usa-menu-btn"
                >
                    Menu
                </button>
            </div>
            <nav
                aria-label="Primary navigation"
                className="usa-nav bg-base-lightest"
            >
                <div className="usa-nav__inner bg-white">
                    <Menu />
                    <div className="usa-nav__secondary margin-bottom-5">
                        <AuthSection />
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
