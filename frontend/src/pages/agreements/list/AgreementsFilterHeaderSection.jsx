import "./AgreementsList.scss";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";
import AgreementsFilterButton from "./AgreementsFilterButton";
import AgreementsFilterTags from "./AgreementsFilterTags";
import icons from "../../../uswds/img/sprite.svg";

/**
 * A header section of the agreements page that contains the filters.
 * @param {Object} props - The component props.
 * @param {Object} props.filters - The current filters.
 * @param {Function} props.setFilters - A function to call to set the filters.
 * @returns {JSX.Element} - The procurement shop select element.
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

    return (
        <div>
            <div
                className="padding-top-05 padding-bottom-05 display-flex flex-align-center"
                style={{ justifyContent: "space-between" }}
            >
                <TabsSection links={links} label="Agreements Tabs Section" />
                <Link
                    to="/agreements/create"
                    className="usa-button usa-button--outline display-flex flex-align-center margin-0 padding-105"
                >
                    <svg
                        className="height-2 width-2 margin-right-05 hover: cursor-pointer usa-tooltip "
                        style={{ fill: "#005ea2" }}
                    >
                        <use xlinkHref={`${icons}#add`}></use>
                    </svg>
                    <span className="">Add Agreement</span>
                </Link>
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
