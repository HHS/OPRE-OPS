import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export const User = () => {
    const user = useSelector((state) => state.auth.activeUser);
    const doesUserHaveName = user?.first_name && user?.last_name;
    const userFullName = user.first_name + " " + user.last_name;

    return (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link to={"/users/" + user?.id}>{user ? (doesUserHaveName ? userFullName : user.email) : "---->"}</Link>
    );
};
