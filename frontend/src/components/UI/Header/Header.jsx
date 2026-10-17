import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import logoIcon from "../../../images/opre-logo.svg";
import AuthSection from "../../Auth/AuthSection";
import HeaderSearch from "./HeaderSearch";
import NavMenu from "./NavMenu";

const Header = () => {
    const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
    const styles = {
        logo: {
            maxWidth: "55%"
        },
        header: {
            position: "relative"
        },
        // A zero-height layer as wide as the page column (1024px), centered like the content below
        // it; the search floats at its right edge, level with the logo.
        search: {
            position: "absolute",
            top: "2.25rem",
            left: 0,
            right: 0,
            width: "min(1024px, 100%)",
            height: 0,
            margin: "0 auto",
            boxSizing: "border-box",
            paddingRight: "1rem",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
            zIndex: 100
        },
        textLogo: {
            color: "#336A90",
            display: "flex",
            alignItems: "flex-end",
            gap: "25px"
        }
    };

    return (
        <header
            className="usa-header usa-header--extended"
            style={styles.header}
        >
            <div className="usa-navbar padding-top-105 bg-white">
                <div
                    className="usa-logo"
                    style={styles.logo}
                    id="logo"
                >
                    <Link
                        to="/"
                        style={styles.textLogo}
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
            {/* Outside .usa-navbar (overflow: auto) so the results dropdown isn't clipped. */}
            {isLoggedIn && (
                <div style={styles.search}>
                    <HeaderSearch />
                </div>
            )}
            <nav
                aria-label="Primary navigation"
                className="usa-nav"
            >
                <div className="usa-nav__inner bg-white border-top border-base-lighter">
                    <NavMenu />
                    <div className="usa-nav__secondary">
                        <AuthSection />
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
