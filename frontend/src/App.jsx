import DefaultLayout from "./components/Layouts/DefaultLayout";
import { useScrollToTop } from "./hooks/useScrollToTop";

/**
 * DefaultLayout component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */

function App({ children, breadCrumbName = "" }) {
    useScrollToTop();

    return <DefaultLayout breadCrumbName={breadCrumbName}>{children}</DefaultLayout>;
}

export default App;
