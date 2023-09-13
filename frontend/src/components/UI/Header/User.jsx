import { Link } from "react-router-dom";
import { CheckAuth, getAccessToken } from "../../Auth/auth";
import { useGetUserByOIDCIdQuery } from "../../../api/opsAPI";
import jwt_decode from "jwt-decode";

export const User = () => {
    const currentJWT = getAccessToken();
    const decodedJwt = jwt_decode(currentJWT);
    const userId = decodedJwt["sub"];
    const { data: user } = useGetUserByOIDCIdQuery(userId);
    const isAuthorized = CheckAuth() && user;
    return (
        <span>
            {isAuthorized ? (
                <Link className="text-primary" to={`/users/${user?.id}`}>
                    {user?.email}
                </Link>
            ) : (
                <span></span>
            )}
        </span>
    );
};
