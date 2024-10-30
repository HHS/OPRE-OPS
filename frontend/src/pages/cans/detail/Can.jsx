import { Route, Routes } from "react-router-dom";
import CanDetail from "./CanDetail";
import App from "../../../App";
import CanDetailTabs from "../../../components/CANs/CanDetailTabs/CanDetailTabs";

const Can = () => {
    return (
        <App breadCrumbName="CAN">
            <section className="display-flex flex-justify margin-top-3">
                <CanDetailTabs canId={502} />
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
