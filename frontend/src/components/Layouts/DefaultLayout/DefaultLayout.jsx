import useAlert from "../../../hooks/use-alert.hooks";
import Alert from "../../UI/Alert";
import SlimAlert from "../../UI/Alert/SlimAlert";
import Footer from "../../UI/Footer";
import Header from "../../UI/Header";
import Breadcrumb from "../../UI/Header/Breadcrumb";

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
            {!import.meta.env.PROD && (
                <SlimAlert
                    type="warning"
                    message="This is a non-production OPS environment for testing purposes only"
                />
            )}
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

export default DefaultLayout;
