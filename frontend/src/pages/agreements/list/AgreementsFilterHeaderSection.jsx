import "./AgreementsList.scss";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";
import AgreementsFilterButton from "./AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags";

/**
 * Header section above the Agreements List table.
 * @returns {ReactNode} The rendered component.
 */
export const AgreementsFilterHeaderSection = ({ filters, setFilters }) => {
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

    // useEffect(() => {
    //     setFilterFunctions((prevState) => [...prevState, () => false]);
    // }, [setFilterFunctions]);

    return (
        <div>
            <div className="padding-top-05 padding-bottom-05 display-flex flex-align-center">
                <TabsSection links={links} label="Agreements Tabs Section" />
            </div>
            <div className="padding-top-05 padding-bottom-05 display-flex" style={{ justifyContent: "space-between" }}>
                <span>
                    <AgreementsFilterTags filters={filters} setFilters={setFilters} />
                </span>
                <span>
                    <AgreementsFilterButton filters={filters} setFilters={setFilters} />
                </span>
            </div>
        </div>
    );
};

export default AgreementsFilterHeaderSection;
