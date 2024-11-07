import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * @typedef {import("../../Users/UserTypes").User} User
 */

/**
 * @typedef {Object} UserProps
 * @property {User} user - The user object.
 */

/**
 * @component Component to display a user's email.
 * @param {UserProps} props - The props of the component.
 * @returns {JSX.Element}
 */
const User = ({ user }) => {
    const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

    return (
        <span>
            {isLoggedIn ? (
                <Link
                    className="text-primary"
                    to={`/users/${user?.id}`}
                >
                    {user?.email}
                </Link>
            ) : (
                <span></span>
            )}
        </span>
    );
};

export default User;
