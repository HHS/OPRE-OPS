import { Outlet } from "react-router-dom";
import { NavigationBlockerProvider } from "../../contexts/NavigationBlockerContext";

/**
 * RouterLayout - A layout component that wraps the NavigationBlockerProvider
 * inside the router context and renders child routes via Outlet.
 *
 * This component is rendered by React Router, ensuring that the
 * NavigationBlockerProvider (which uses useBlocker) is called within
 * the router context as required.
 */
const RouterLayout = () => {
    return (
        <NavigationBlockerProvider>
            <Outlet />
        </NavigationBlockerProvider>
    );
};

export default RouterLayout;
