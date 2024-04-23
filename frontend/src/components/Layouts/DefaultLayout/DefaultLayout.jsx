import PropTypes from "prop-types";
import Header from "../../UI/Header";
import Footer from "../../UI/Footer";
import Alert from "../../UI/Alert";
import Breadcrumb from "../../UI/Header/Breadcrumb";
import useAlert from "../../../hooks/use-alert.hooks";

/**
 * DefaultLayout component
 * @component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 * @returns {JSX.Element} - The rendered component
 */
const DefaultLayout = ({ children, breadCrumbName }) => {
    const { isAlertActive } = useAlert();

    return (
        <div className="bg-base-lightest">
            <div className="usa-overlay"></div>
            <Header />
            <main
                id="main-content"
                className="grid-container bg-white padding-bottom-6"
            >
                {breadCrumbName ? <Breadcrumb currentName={breadCrumbName} /> : null}
                {isAlertActive && <Alert />}
                {children}
            </main>
            <Footer />
        </div>
    );
};

DefaultLayout.propTypes = {
    children: PropTypes.node.isRequired,
    breadCrumbName: PropTypes.string
};
export default DefaultLayout;
