import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

export const User = ({ user }) => {
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

User.propTypes = {
    user: PropTypes.object.isRequired
};
