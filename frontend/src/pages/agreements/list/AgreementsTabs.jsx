import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";
import tabStyles from "./AgreementTabs.module.css";

/**
 * A header section of the agreements page that contains the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */

/* TODO: make api call to replace hard-coded value */

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
            name: "?filter=change-requests",
            label: "For Review"
        }
    ];

    const links = paths.map((path) => {
        const queryString = `${path.name}`;

        return (
            <>
                <Link
                    to={queryString}
                    className={location.search === queryString ? selected : notSelected}
                    key={queryString}
                >
                    {path.label}
                </Link>
                <span className={`margin-left-neg-1 position-absolute bottom-2 ${tabStyles.notificationCircle}`}>
                    5
                </span>
            </>
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
