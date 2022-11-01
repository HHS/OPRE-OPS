import { BreadcrumbList } from "./Breadcrumb";

import { TitleBar } from "./TitleBar";

const Header = () => {
    return (
        <header className="usa-header usa-header--extended">
            <div className="usa-nav-container">
                <TitleBar />
                <BreadcrumbList isCurrent />
            </div>
        </header>
    );
};

export default Header;
