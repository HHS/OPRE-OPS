import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import App from "../../../App";
import { getCanList } from "./getCanList";
import TextClip from "../../../components/UI/Text/TextClip";
import DebugCode from "../../../components/DebugCode";
import TablePageLayout from "../../../components/Layouts/TablePageLayout";
import BLITags from "../../budgetLines/list/BLITabs";
import CANTags from "./CansTabs";

const CanList = () => {
    const dispatch = useDispatch();
    const canList = useSelector((state) => state.canList.cans);
    const myCANsUrl = false;
    useEffect(() => {
        dispatch(getCanList());
    }, [dispatch]);

    // TODO: remove flag once CANS are ready
    /*<DebugCode data={canList}/>*/
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
                />
            </App>
        )
    );
};

export default CanList;
