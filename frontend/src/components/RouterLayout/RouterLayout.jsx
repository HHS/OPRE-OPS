import { Outlet } from "react-router-dom";

/**
 * RouterLayout - A simple layout component that renders child routes via Outlet.
 *
 * This component is rendered by React Router and provides a clean
 * layout without additional context providers.
 */
const RouterLayout = () => {
    return <Outlet />;
};

export default RouterLayout;
