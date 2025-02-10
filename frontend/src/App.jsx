import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultLayout from "./components/Layouts/DefaultLayout";
import { setNavigate } from "./errorMiddleware";

/**
 * DefaultLayout component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */
function App({ children, breadCrumbName = "" }) {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    React.useEffect(() => {
        // Wrap navigate to always use replace for auth-related navigation
        setNavigate((path) => navigate(path, { replace: true }));
    }, [navigate]);

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return <DefaultLayout breadCrumbName={breadCrumbName}>{children}</DefaultLayout>;
}

export default App;
