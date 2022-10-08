import { BreadcrumbList } from "../Breadcrumb";
import AuthSection from "../Auth/AuthSection";

const Header = () => {
    return (
        <header className="usa-header usa-header--extended">
            <AuthSection />
            <BreadcrumbList isCurrent />
            <div className="usa-alert usa-alert--error" role="alert">
                <div className="usa-alert__body">
                    <h4 className="usa-alert__heading">Under Construction</h4>
                    <p className="usa-alert__text">This is a developer prototype, please do not judge me</p>
                </div>
            </div>
        </header>
    );
};

export default Header;
