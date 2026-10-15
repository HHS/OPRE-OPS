import { Outlet } from "react-router-dom";
import App from "../../App";

/**
 * @component - Just chrome around the routed content. The welcome message, OPS Updates
 * cards, and tab nav all live in HomeLanding (the pathless layout route wrapping "/",
 * "/ops-at-a-glance", "/ops-benefits"), not here.
 * @returns {React.ReactElement}
 */
const Home = () => (
    <App>
        <Outlet />
    </App>
);

export default Home;
