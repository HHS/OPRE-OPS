import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";

/**
 * A header section of the Budget lines list page that contains the filters.
 * @component
 * @returns {JSX.Element} - The procurement shop select element.
 */
const BLITags = () => {
    const location = useLocation();
    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "",
            label: "All Budget Lines"
        },
        {
            name: "?filter=my-budget-lines",
            label: "My Budget Lines"
        }
    ];

    const links = paths.map((path) => {
        const queryString = `${path.name}`;

        return (
            <Link
                to={queryString}
                className={location.search === queryString ? selected : notSelected}
                key={queryString}
                data-cy={location.search === queryString ? "tab-selected" : "tab-not-selected"}
            >
                {path.label}
            </Link>
        );
    });

    return (
        <TabsSection
            links={links}
            label="Budget Lines Tabs Section"
        />
    );
};

export default BLITags;
