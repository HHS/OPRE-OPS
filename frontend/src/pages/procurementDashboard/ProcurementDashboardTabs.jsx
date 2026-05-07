import { Link, useLocation } from "react-router-dom";
import styles from "../../components/Agreements/DetailsTabs/DetailsTabs.module.scss";
import Tooltip from "../../components/UI/USWDS/Tooltip";
import TabsSection from "../../components/UI/TabsSection";

const ProcurementDashboardTabs = () => {
    const { search } = useLocation();

    const basePath = "/procurement-dashboard";

    const paths = [
        {
            name: "",
            label: "All Procurement"
        },
        {
            name: "?filter=first-award",
            label: "First Award",
            disabled: true,
            disabledTooltip: "Coming soon"
        },
        {
            name: "?filter=modifications",
            label: "Modifications",
            disabled: true,
            disabledTooltip: "Coming soon"
        }
    ];

    const getClassName = (queryString) =>
        `font-sans-2xs text-bold ${search === queryString ? styles.listItemSelected : styles.listItemNotSelected}`;

    const renderLinks = () =>
        paths.map((path) => {
            const queryString = path.name;

            if (path.disabled) {
                const button = (
                    <button
                        key={queryString || "all"}
                        className={`${getClassName(queryString)} ${styles.btnDisabled}`}
                        disabled
                    >
                        {path.label}
                    </button>
                );

                return (
                    <Tooltip
                        key={queryString || "all"}
                        label={path.disabledTooltip}
                        position="top"
                    >
                        {button}
                    </Tooltip>
                );
            }

            return (
                <Link
                    key={queryString || "all"}
                    to={`${basePath}${queryString}`}
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
