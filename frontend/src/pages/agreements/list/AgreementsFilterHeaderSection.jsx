import "./AgreementsList.scss";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";

export const AgreementsFilterHeaderSection = () => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "/all-agreements",
            label: "All Agreements",
        },
        {
            name: "/my-agreements",
            label: "My Agreements",
        },
    ];

    const links = paths.map((path) => {
        const pathName = `/agreements${path.name}`;

        return (
            <Link to={pathName} className={location.pathname === pathName ? selected : notSelected} key={pathName}>
                {path.label}
            </Link>
        );
    });

    return (
        <div className="padding-top-05 padding-bottom-05">
            <TabsSection links={links} label="Agreements Tabs Section" />
        </div>
    );
};

export default AgreementsFilterHeaderSection;
