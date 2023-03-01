import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";

export const User = () => {
    const user = useSelector((state) => state.auth.activeUser);
    if (CheckAuth() && user) {
        return <Link to={`/users/${user?.id}`}>{user?.email}</Link>;
    }
    return <span></span>;
};
