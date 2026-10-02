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
        {/* Visually hidden page-level heading — the redesign has no visible h1 until the
            welcome message (from #6338) lands here; this keeps the page a11y-compliant
            (one h1 per page) in the meantime, since the tab panels below start at h2. */}
        <h1 className="usa-sr-only">Home</h1>
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
