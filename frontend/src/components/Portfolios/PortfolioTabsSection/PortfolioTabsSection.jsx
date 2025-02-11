import styles from "./PortfolioTabsSection.module.scss";
import { Link, useLocation } from "react-router-dom";
import TabsSection from "../../UI/TabsSection";

/**
 * Tabs (navigation) section for the portfolio page.
 * @param {Object} props - The component props.
 * @param {number} props.portfolioId - The Portfolio ID.
 * @returns {ReactNode} The rendered component.
 */
const PortfolioTabsSection = ({ portfolioId }) => {
    const location = useLocation();

    const selected = `font-sans-2xs text-bold ${styles.listItemSelected}`;

    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected}`;

    const paths = [
        {
            name: "/spending",
            label: "Portfolio Spending"
        },
        {
            name: "/funding",
            label: "Portfolio Funding"
        }
    ];

    const links = paths.map((path) => {
        const pathName = `/portfolios/${portfolioId}${path.name}`;

        return (
            <Link
                to={pathName}
                className={location.pathname === pathName ? selected : notSelected}
                key={pathName}
            >
                {path.label}
            </Link>
        );
    });

    return (
        <>
            <TabsSection
                links={links}
                label="Portfolio Tabs Section"
            />
        </>
    );
};

export default PortfolioTabsSection;
