import { Route, Routes, useParams } from "react-router-dom";
import CanDetail from "./CanDetail";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";
import { useGetCanByIdQuery } from "../../../api/opsAPI";
import PageHeader from "../../../components/UI/PageHeader";

/**
    @typedef {import("../../../components/CANs/CANTypes").CAN} CAN
*/

const Can = () => {
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id || "-1");
    /** @type {{data?: CAN | undefined, isLoading: boolean}} */
    const { data: can, isLoading } = useGetCanByIdQuery(canId);

    if (isLoading) {
        return <div> Loading Can... </div>;
    }
    if (!can) {
        return <div>Can not found</div>;
    }

    const subTitle = `${can.nick_name} - ${can.active_period} ${can?.active_period > 1 ? "Years" : "Year"}`;

    return (
        <App breadCrumbName={can.display_name}>
            <PageHeader
                title={can.display_name || "TBD"}
                subTitle={subTitle}
            />

            <section className="display-flex flex-justify margin-top-3">
                <CanDetailTabs canId={canId} />
            </section>
            <Routes>
                <Route
                    path=""
                    element={<CanDetail can={can} />}
                />
            </Routes>
        </App>
    );
};

export default Can;
