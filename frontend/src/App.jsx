import DefaultLayout from "./components/Layouts/DefaultLayout";
import { useScrollToTop } from "./hooks/useScrollToTop";

/**
 * DefaultLayout component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb; omit it for no breadcrumb, or pass "" for a breadcrumb whose leaf is still loading
 * @param {{ label: string, to: string }} [props.breadCrumbParent] - The resource the current page belongs to, shown before it in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */

function App({ children, breadCrumbName, breadCrumbParent }) {
    useScrollToTop();

    return (
        <DefaultLayout
            breadCrumbName={breadCrumbName}
            breadCrumbParent={breadCrumbParent}
        >
            {children}
        </DefaultLayout>
    );
}

export default App;
