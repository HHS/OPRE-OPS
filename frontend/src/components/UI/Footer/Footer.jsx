import { AgencyInfo } from "./AgencyInfo";
import { Identifier } from "./Idnetifier";
import { NavFooter } from "./NavFooter";
import { Link } from "react-router-dom";

export const Footer = () => {
    return (
        <footer className="usa-footer">
            <div className="grid-container usa-footer__return-to-top">
                <Link to="#">Return to top</Link>
            </div>
            <div className="usa-footer__primary-section">
                <NavFooter />
            </div>
            <div className="usa-footer__secondary-section">
                <AgencyInfo />
            </div>
            <Identifier />
        </footer>
    );
};
