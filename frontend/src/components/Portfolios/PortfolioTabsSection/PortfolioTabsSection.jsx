import styles from "./PortfolioTabsSection.module.scss";
import { Link, useLocation } from "react-router-dom";
import TabsSection from "../../UI/TabsSection";

const PortfolioTabsSection = ({ portfolioId }) => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "/budget-and-funding",
            label: "Budget and Funding",
        },
        {
            name: "/research-projects",
            label: "Projects and Spending",
        },
        {
            name: "/people-and-teams",
            label: "People and Teams",
        },
    ];

    const links = paths.map((path) => {
        const pathName = `/portfolios/${portfolioId}${path.name}`;

        return (
            <Link to={pathName} className={location.pathname === pathName ? selected : notSelected} key={pathName}>
                {path.label}
            </Link>
        );
    });

    return (
        <>
            <TabsSection links={links} label="Portfolio Tabs Section" />
        </>
    );
};

export default PortfolioTabsSection;
