import { Outlet } from "react-router-dom";
import Tabs from "../../components/UI/Tabs";

/**
 * @component - Layout for the redesigned homepage's tabbed content (What's New,
 * OPS at a Glance, OPS Benefits). Rendered as a pathless layout route nested under
 * Home, so the tab nav persists across tab switches while the active tab's content
 * renders via Outlet.
 * @returns {React.ReactElement}
 */
const HomeLanding = () => (
    <>
        <Tabs
            paths={[
                { pathName: "/", label: "What's New" },
                { pathName: "/ops-at-a-glance", label: "OPS at a Glance" },
                { pathName: "/ops-benefits", label: "OPS Benefits" }
            ]}
        />
        <Outlet />
    </>
);

export default HomeLanding;
