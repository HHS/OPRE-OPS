import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";

export const User = () => {
    const user = useSelector((state) => state.auth.activeUser);
    const isAuthorized = CheckAuth() && user;
    return <span>{isAuthorized ? <Link to={`/users/${user?.id}`}>{user?.email}</Link> : <span></span>}</span>;
};
