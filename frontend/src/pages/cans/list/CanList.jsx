import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useGetCansQuery } from "../../../api/opsAPI";
import App from "../../../App";
import CANTable from "../../../components/CANs/CANTable";
import CANTags from "../../../components/CANs/CanTabs";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import FiscalYear from "../../../components/UI/FiscalYear";
import { setSelectedFiscalYear } from "../../../pages/cans/detail/canDetailSlice";
import ErrorPage from "../../ErrorPage";
import { sortAndFilterCANs } from "./CanList.helpers";

/**
 * Page for the CAN List.
 * @component
 * @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
 * @returns {JSX.Element | boolean} - The component JSX.
 */
const CanList = () => {
    const [searchParams] = useSearchParams();
    const myCANsUrl = searchParams.get("filter") === "my-cans";
    const { data: canList, isError, isLoading } = useGetCansQuery({});
    const activeUser = useSelector((state) => state.auth.activeUser);
    const sortedCANs = sortAndFilterCANs(canList, myCANsUrl, activeUser) || [];
    const selectedFiscalYear = useSelector((state) => state.canDetail.selectedFiscalYear);

    if (isLoading) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (isError) {
        return <ErrorPage />;
    }

    const CANFiscalYearSelect = () => {
        return (
            <FiscalYear
                fiscalYear={selectedFiscalYear}
                handleChangeFiscalYear={setSelectedFiscalYear}
            />
        );
    };
    // TODO: remove flag once CANS are ready
    return (
        import.meta.env.DEV && (
            <App breadCrumbName="CANs">
                <TablePageLayout
                    title="CANs"
                    subtitle={myCANsUrl ? "My CANs" : "All CANs"}
                    details={
                        myCANsUrl
                            ? "This is a list of CANs from agreements you are listed as a team member on. Please select filter options to see CANs by Portfolio, Fiscal Year, or other criteria."
                            : "This is a list of all CANs across OPRE that are or were active within the selected Fiscal Year."
                    }
                    TabsSection={<CANTags />}
                    TableSection={<CANTable cans={sortedCANs} />}
                    FYSelect={<CANFiscalYearSelect />}
                />
            </App>
        )
    );
};

export default CanList;
