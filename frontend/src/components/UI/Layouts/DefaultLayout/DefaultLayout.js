import PropTypes from "prop-types";
import Header from "../../Header";
import Footer from "../../Footer";
import Alert from "../../Alert";
import Breadcrumb from "../../Header/Breadcrumb";
import useAlert from "../../../../helpers/use-alert";

/**
 * DefaultLayout component
 * @param {Object} props - Properties passed to component
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */
const DefaultLayout = ({ children, breadCrumbName }) => {
    const { isAlertActive } = useAlert();

    return (
        <div className="bg-base-lightest">
            <div className="usa-overlay"></div>
            <Header />
            {breadCrumbName ? <Breadcrumb currentName={breadCrumbName} /> : null}
            {isAlertActive && <Alert />}
            <main
                id="main-content"
                className="grid-container bg-white padding-bottom-6"
            >
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
