import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export const User = () => {
    const user = useSelector((state) => state.auth.userDetails);

    return (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link to={"/users/" + user?.id}>{user ? `${user.first_name} ${user.last_name}` : "---->"}</Link>
    );
};
