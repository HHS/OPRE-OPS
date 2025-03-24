import React from "react";
import ErrorPage from "../../pages/ErrorPage";

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
        console.error(error, errorInfo);
    }

    /**
     * @returns {React.ReactNode}
     */
    render() {
        if (this.state.hasError) {
            return <ErrorPage />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
