import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";
import { useChangeRequestTotal } from "../../../hooks/useChangeRequests.hooks";
import tabStyles from "./AgreementTabs.module.css";

/**
 * A header section of the agreements page that contains the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */

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

const AgreementTabs = () => {
    const { search } = useLocation();
    const changeRequestsTotal = useChangeRequestTotal();
    /**
     * @param {string} queryString - The query string of the tab.
     */
    const getClassName = (queryString) =>
        `font-sans-2xs text-bold ${search === queryString ? styles.listItemSelected : styles.listItemNotSelected}`;

    const renderLinks = () =>
        paths.map((path) => {
            const queryString = `${path.name}`;
            const hasChangeRequestsOnReviewTab = path.label === "For Review" && changeRequestsTotal > 0;

            return (
                <React.Fragment key={queryString}>
                    <Link
                        to={queryString}
                        className={getClassName(queryString)}
                    >
                        {path.label}
                    </Link>
                    {hasChangeRequestsOnReviewTab && (
                        <span
                            className={`margin-left-neg-1 position-absolute bottom-2 ${tabStyles.notificationCircle}`}
                        >
                            {changeRequestsTotal}
                        </span>
                    )}
                </React.Fragment>
            );
        });

    return (
        <TabsSection
            links={renderLinks()}
            label="Agreements Tabs Section"
        />
    );
};

export default AgreementTabs;
