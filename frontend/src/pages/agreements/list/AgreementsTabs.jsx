import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";

/**
 * A header section of the agreements page that contains the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */
export const AgreementTabs = () => {
    const location = useLocation();
    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;
    const paths = [
        {
            name: "",
            label: "All Agreements"
        },
        {
            name: "?filter=my-agreements",
            label: "My Agreements"
        },
        {
            name: "?filter=for-approval",
            label: "Workflows"
        },
        {
            name: "?filter=change-requests",
            label: "Change Requests"
        }
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
        <TabsSection
            links={links}
            label="Agreements Tabs Section"
        />
    );
};

export default AgreementTabs;
