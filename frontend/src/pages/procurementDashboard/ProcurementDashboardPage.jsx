import icons from "../../uswds/img/sprite.svg";
import App from "../../App";
import TablePageLayout from "../../components/Layouts/TablePageLayout";
import ProcShopFilter from "./ProcShopFilter";
import ProcurementDashboardTabs from "./ProcurementDashboardTabs";
import ProcurementSummaryCards from "./ProcurementSummaryCards";

const ProcurementDashboard = () => {
    return (
        <App breadCrumbName="Procurement Dashboard">
            <TablePageLayout
                title="Procurement Dashboard"
                subtitle="Procurement Summary"
                details={`This is a summary of all agreements currently in procurement for FY ${"2026"}.`}
                TabsSection={<ProcurementDashboardTabs />}
                FYSelect={
                    <ProcShopFilter
                        value="all"
                        onChange={() => {}}
                    />
                }
                FilterButton={
                    <button
                        style={{ fontSize: "16px" }}
                        className="usa-button--unstyled text-primary display-flex flex-align-end cursor-pointer"
                        data-cy="procurement-export"
                        onClick={() => {}}
                    >
                        <svg
                            className="height-2 width-2 margin-right-05"
                            style={{ fill: "#005EA2", height: "24px", width: "24px" }}
                        >
                            <use href={`${icons}#save_alt`}></use>
                        </svg>
                        <span>Export</span>
                    </button>
                }
                SummaryCardsSection={<ProcurementSummaryCards />}
            />
        </App>
    );
};

export default ProcurementDashboard;
