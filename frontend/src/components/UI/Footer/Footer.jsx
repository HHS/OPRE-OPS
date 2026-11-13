import Identifier from "./Identifier";

const Footer = () => {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
        // preventScroll avoids fighting the smooth scroll above — focus() would
        // otherwise trigger its own (instant) scroll-into-view.
        document.getElementById("main-content")?.focus({ preventScroll: true });
    };
    return (
        <footer className="usa-footer">
            <div className="grid-container usa-footer__return-to-top bg-white">
                <button
                    type="button"
                    className="text-underline text-primary cursor-pointer"
                    onClick={scrollToTop}
                >
                    Return to top
                </button>
            </div>
            <Identifier />
        </footer>
    );
};

export default Footer;
