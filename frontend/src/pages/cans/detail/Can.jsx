import { Route, Routes, useParams } from "react-router-dom";
import CanDetail from "./CanDetail";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";

const Can = () => {
    const urlPathParams = useParams();
    const canId = parseInt(urlPathParams.id || "-1");

    return (
        <App breadCrumbName="CAN">
            <section className="display-flex flex-justify margin-top-3">
                <CanDetailTabs canId={canId} />
            </section>
            <Routes>
                <Route
                    path=""
                    element={<CanDetail />}
                />
            </Routes>
        </App>
    );
};

export default Can;
