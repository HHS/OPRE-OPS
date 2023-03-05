import { Navigate, Outlet } from "react-router-dom";
import { CheckAuth } from "../auth";

export const ProtectedRoute = ({ redirectPath = "/", children }) => {
    const isAuthorized = CheckAuth();
    if (!isAuthorized) {
        // user is not authenticated
        console.log("User is not authenticated, redirecting...");
        return <Navigate to={redirectPath} />;
    }
    console.log("Authorized!!!");
    return children ? children : <Outlet />;
};
