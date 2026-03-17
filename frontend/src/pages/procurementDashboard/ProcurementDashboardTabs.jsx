import { Link, useLocation } from "react-router-dom";
import styles from "../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../components/UI/TabsSection";

const ProcurementDashboardTabs = () => {
    const { search } = useLocation();

    const paths = [
        {
            name: "",
            label: "First Award"
        },
        {
            name: "?filter=modifications",
            label: "Modifications"
        },
        {
            name: "?filter=all-procurement",
            label: "All Procurement"
        }
    ];

    const getClassName = (queryString) =>
        `font-sans-2xs text-bold ${search === queryString ? styles.listItemSelected : styles.listItemNotSelected}`;

    const renderLinks = () =>
        paths.map((path) => {
            const queryString = `${path.name}`;

            return (
                <Link
                    key={queryString}
                    to={queryString}
                    className={getClassName(queryString)}
                >
                    {path.label}
                </Link>
            );
        });

    return (
        <TabsSection
            links={renderLinks()}
            label="Procurement Dashboard Tabs Section"
        />
    );
};

export default ProcurementDashboardTabs;
