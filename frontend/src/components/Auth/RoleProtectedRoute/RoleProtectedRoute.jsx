import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { PacmanLoader } from "react-spinners";
import PropTypes from "prop-types";
import { getAccessToken, setActiveUser } from "../auth";
import { login } from "../authSlice";

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
    const dispatch = useDispatch();
    const activeUser = useSelector((state) => state.auth?.activeUser);

    // Hydrate activeUser independently since AuthSection won't mount until after the role check.
    useEffect(() => {
        if (!activeUser) {
            const token = getAccessToken();
            if (token) {
                dispatch(login());
                setActiveUser(token, dispatch);
            }
        }
    }, [activeUser, dispatch]);

    if (!activeUser) {
        return (
            <div className="bg-white display-flex flex-column flex-align-center flex-justify-center padding-y-4 height-viewport">
                <h1 className="margin-bottom-2">Loading...</h1>
                <PacmanLoader
                    size={25}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
            </div>
        );
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
