import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * @typedef {import("../../../types/UserTypes").User} User
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
    const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
    const email = user?.email?.trim();
    const profileLabel = email || "User profile";

    return (
        <span>
            {isLoggedIn ? (
                user?.id ? (
                    <Link
                        className="text-primary"
                        to={`/users/${user.id}`}
                        aria-label={profileLabel}
                    >
                        {profileLabel}
                    </Link>
                ) : (
                    <span className="text-primary">{profileLabel}</span>
                )
            ) : (
                <span></span>
            )}
        </span>
    );
};

export default User;
