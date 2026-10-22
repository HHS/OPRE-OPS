import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import logoIcon from "../../../images/opre-logo.svg";
import AuthSection from "../../Auth/AuthSection";
import HeaderSearch from "./HeaderSearch";
import searchStyles from "./HeaderSearch/HeaderSearch.module.scss";
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
        // USWDS pins the user/sign-out links to the bottom of the logo band; lift them one row so the
        // search can sit directly underneath, as in the prototype. Moves with the search layer's `top`.
        secondary: {
            top: "-6.9375rem"
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
            <nav
                aria-label="Primary navigation"
                className="usa-nav"
            >
                <div className="usa-nav__inner bg-white border-top border-base-lighter">
                    <NavMenu />
                    <div
                        className="usa-nav__secondary"
                        style={styles.secondary}
                    >
                        <AuthSection />
                    </div>
                </div>
            </nav>
            {/*
              Outside .usa-navbar (overflow: auto) so the results dropdown isn't clipped. The layer has no
              z-index and comes after the nav, so the search box paints over the nav links but under modal
              overlays (ReactModal portals are appended to <body>, later still). Only the open dropdown
              carries its own z-index (see HeaderSearch.module.scss) so page content can't cover it; a modal
              can't be opened while it is showing, because moving focus off the box closes it.
            */}
            {isLoggedIn && (
                <div
                    className={searchStyles.layer}
                    data-cy="header-search-layer"
                >
                    <HeaderSearch />
                </div>
            )}
        </header>
    );
};

export default Header;
