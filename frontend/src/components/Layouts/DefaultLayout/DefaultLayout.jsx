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
 * @param {string} [props.breadCrumbName] - The name of the current page to be displayed in the breadcrumb; omit it for no breadcrumb, or pass "" for a breadcrumb whose leaf is still loading
 * @param {{ label: string, to: string }} [props.breadCrumbParent] - The resource the current page belongs to, shown before it in the breadcrumb
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 * @returns {React.ReactElement} - The rendered component
 */
const DefaultLayout = ({ children, breadCrumbName, breadCrumbParent }) => {
    const { isAlertActive } = useAlert();

    return (
        <div className="bg-ops-shell">
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
                {breadCrumbName != null ? (
                    <Breadcrumb
                        currentName={breadCrumbName}
                        parentCrumb={breadCrumbParent}
                    />
                ) : null}
                {isAlertActive && <Alert />}
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default DefaultLayout;
