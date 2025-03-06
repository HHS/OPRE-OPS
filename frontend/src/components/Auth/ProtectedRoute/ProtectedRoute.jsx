import { Navigate, Outlet, useLocation } from "react-router-dom";
import { CheckAuth } from "../auth";
import { useSelector } from "react-redux";

/**
 * A route component that protects routes requiring authentication
 * Redirects to login if user is not authenticated, preserving the intended destination
 *
 * @param {Object} props - Component props
 * @param {string} [props.redirectPath="/login"] - Path to redirect to if not authenticated
 * @param {React.ReactNode} [props.children] - Child components to render if authenticated
 * @returns {React.ReactElement} The protected route component
 */
export const ProtectedRoute = ({ redirectPath = "/login", children }) => {
    const location = useLocation();
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

    // Only check auth if not already logged in according to Redux state
    const isAuthorized = isLoggedIn ? true : CheckAuth();

    if (!isAuthorized && !isLoggedIn) {
        // User is not authenticated, redirect to login with the current location in state
        // This allows redirecting back after successful login
        return (
            <Navigate
                to={redirectPath}
                state={{ from: location }}
                replace
            />
        );
    }

    // If authenticated, render children or outlet for nested routes
    return children ? children : <Outlet />;
};
