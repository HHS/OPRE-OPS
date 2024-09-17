// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
import App from "../../../App";
import CANTable from "../../../components/CANs/CANTable";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import CANTags from "./CanTabs";
// import { getCanList } from "./getCanList";
import { useSearchParams } from "react-router-dom";
import { useGetCansQuery } from "../../../api/opsAPI";
import ErrorPage from "../../ErrorPage";

const CanList = () => {
    // const dispatch = useDispatch();
    // const canList = useSelector((state) => state.canList.cans);
    const [searchParams] = useSearchParams();
    const myCANsUrl = searchParams.get("filter") === "my-cans";
    // useEffect(() => {
    //     dispatch(getCanList());
    // }, [dispatch]);
    const { data: canList, isError, isLoading } = useGetCansQuery();
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
    // TODO: remove flag once CANS are ready
    return (
        import.meta.env.DEV && (
            <App breadCrumbName="CANs">
                <TablePageLayout
                    title="CANs"
                    subtitle={myCANsUrl ? "My CANs" : "All CANs"}
                    details={
                        myCANsUrl
                            ? "This is a list of the CANs you are listed as a Team Member on within the selected Fiscal Year. Please select filter options to see CANs by Portfolio, Status, or Fiscal Year."
                            : "This is a list of all CANs across OPRE that are or were active within the selected Fiscal Year."
                    }
                    TabsSection={<CANTags />}
                    TableSection={<CANTable cans={canList} />}
                />
                <DebugCode data={canList} />
            </App>
        )
    );
};

export default CanList;
