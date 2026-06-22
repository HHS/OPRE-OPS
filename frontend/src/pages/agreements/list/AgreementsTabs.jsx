import React from "react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import styles from "../../../components/Portfolios/PortfolioTabsSection/PortfolioTabsSection.module.scss";
import TabsSection from "../../../components/UI/TabsSection";
import { USER_ROLES } from "../../../components/Users/User.constants";
import { useChangeRequestTotal } from "../../../hooks/useChangeRequests.hooks";
import tabStyles from "./AgreementTabs.module.css";

/**
 * A header section of the agreements page that contains the filters.
 * @returns {JSX.Element} - The procurement shop select element.
 */

const AgreementTabs = () => {
    const { search } = useLocation();
    const changeRequestsTotal = useChangeRequestTotal();
    const userRoles = useSelector((state) => state.auth?.activeUser?.roles) ?? [];
    // Only display the "For Review" tab if the user has the REVIEWER_APPROVER, SUPER_USER, or BUDGET_TEAM role
    const displayReviewTab = userRoles.some(
        (role) =>
            role?.name === USER_ROLES.REVIEWER_APPROVER ||
            role?.name === USER_ROLES.SUPER_USER ||
            role?.name === USER_ROLES.BUDGET_TEAM
    );

    const paths = [
        {
            name: "",
            label: "All Agreements"
        },
        {
            name: "?filter=my-agreements",
            label: "My Agreements"
        },
        ...(displayReviewTab
            ? [
                  {
                      name: "?filter=change-requests",
                      label: "For Review"
                  }
              ]
            : [])
    ];
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
                            className={`position-absolute bottom-2 ${tabStyles.notificationCircle}`}
                            style={{ marginLeft: "2px" }}
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
