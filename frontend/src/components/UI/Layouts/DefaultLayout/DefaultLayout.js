import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import Header from "../../Header";
import Footer from "../../Footer";
import Alert from "../../Alert";

/**
 * DefaultLayout component
 * @param {Object} props - Properties passed to component
 * @param {React.ReactNode} props.children - The child nodes to be rendered within the layout
 */
const DefaultLayout = ({ children }) => {
    const isAlertActive = useSelector((state) => state.alert.isActive);
    return (
        <div className="bg-base-lightest">
            <div className="usa-overlay"></div>
            <Header />
            {isAlertActive && <Alert />}
            <main id="main-content" className="grid-container bg-white padding-bottom-6">
                {children}
            </main>
            <Footer />
        </div>
    );
};

DefaultLayout.propTypes = {
    children: PropTypes.node,
};
export default DefaultLayout;
