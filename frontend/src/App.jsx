import PropTypes from "prop-types";
import DefaultLayout from "./components/Layouts/DefaultLayout";

/**
 * DefaultLayout component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */
function App({ children, breadCrumbName = "" }) {
    return <DefaultLayout breadCrumbName={breadCrumbName}>{children}</DefaultLayout>;
}

App.propTypes = {
    children: PropTypes.node.isRequired,
    breadCrumbName: PropTypes.string
};
export default App;
