import AgencyInfo from "./AgencyInfo";
import Identifier from "./Identifier";
import NavFooter from "./NavFooter";

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };
    return (
        <footer className="usa-footer">
            <div className="grid-container usa-footer__return-to-top bg-white">
                <button
                    className="text-underline text-primary cursor-pointer"
                    onClick={scrollToTop}
                >
                    Return to top
                </button>
            </div>
            <div className="usa-footer__primary-section bg-base-light">
                <NavFooter />
            </div>
            <div className="usa-footer__secondary-section">
                <AgencyInfo />
            </div>
            <Identifier />
        </footer>
    );
};

export default Footer;
