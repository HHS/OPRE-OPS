import "./AgreementsList.scss";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";

/**
 * Header section above the Agreements List table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterHeaderSection = () => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "?filter=all-agreements",
            label: "All Agreements",
        },
        {
            name: "?filter=my-agreements",
            label: "My Agreements",
        },
    ];

    const links = paths.map((path) => {
        const queryString = `${path.name}`;

        return (
            <Link
                to={queryString}
                className={location.search === queryString ? selected : notSelected}
                key={queryString}
            >
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
