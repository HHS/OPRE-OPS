import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

/**
 * A route component that restricts access based on user roles.
 * Must be used inside a ProtectedRoute (assumes user is already authenticated).
 * Redirects to the error page if the user does not have one of the allowed roles.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of role names that are authorized to access the route.
 * @param {React.ReactNode} [props.children] - Child components to render if authorized.
 * @returns {React.ReactElement}
 */
const RoleProtectedRoute = ({ allowedRoles, children }) => {
    const activeUser = useSelector((state) => state.auth?.activeUser);

    // Wait for auth hydration — activeUser is set asynchronously after login
    if (!activeUser) {
        return children ? children : <Outlet />;
    }

    const userRoles = activeUser?.roles ?? [];
    const hasRequiredRole = userRoles.some((role) => allowedRoles.includes(role.name));

    if (!hasRequiredRole) {
        return (
            <Navigate
                to="/error"
                replace
            />
        );
    }

    return children ? children : <Outlet />;
};

RoleProtectedRoute.propTypes = {
    allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
    children: PropTypes.node
};

export default RoleProtectedRoute;
