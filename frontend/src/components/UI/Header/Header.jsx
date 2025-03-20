import { Link } from "react-router-dom";
import AuthSection from "../../Auth/AuthSection";
import { Menu } from "./Menu";
import logoIcon from "../../../images/opre-logo.svg";

const Header = () => {
    const styles = {
        logo: {
            maxWidth: "55%"
        },
        textlogo: {
            color: "#336A90",
            display: "flex",
            alignItems: "flex-end",
            gap: "25px"
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
                            src={logoIcon}
                            alt="OPRE Logo"
                        />
                        <span className="font-sans-sm text-bold">&nbsp;Portfolio Management System</span>
                    </Link>
                </div>
            </div>
            <nav
                aria-label="Primary navigation"
                className="usa-nav bg-base-lightest"
            >
                <div className="usa-nav__inner bg-white">
                    <Menu />
                    <div className="usa-nav__secondary">
                        <AuthSection />
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
