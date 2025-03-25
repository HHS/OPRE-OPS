import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import ErrorPage from "../../pages/ErrorPage";
import store from "../../store";

class ErrorBoundary extends React.Component {
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    /**
     * @param {Error} error
     * @returns {Object}
     */
    // eslint-disable-next-line no-unused-vars
    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    /**
     * @param {Error} error
     * @param {Object} errorInfo
     */
    componentDidCatch(error, errorInfo) {
        // NOTE: You can also log the error to an error reporting service
        console.group("🚨 React Error Boundary Caught an Error");
        console.error("Error:", error);
        console.error("Component Stack:", errorInfo.componentStack);
        console.groupEnd();
    }

    /**
     * @returns {React.ReactNode}
     */
    render() {
        if (this.state.hasError) {
            return (
                <BrowserRouter>
                    <Provider store={store}>
                        <ErrorPage />
                    </Provider>
                </BrowserRouter>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
