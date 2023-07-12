import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";
import { useGetUserByOIDCIdQuery } from "../../../api/opsAPI";
import jwt_decode from "jwt-decode";

export const User = () => {
    const currentJWT = localStorage.getItem("access_token");
    const decodedJwt = jwt_decode(currentJWT);
    const userId = decodedJwt["sub"];
    const { data: user } = useGetUserByOIDCIdQuery(userId);
    const isAuthorized = CheckAuth() && user;
    return (
        <span>
            {isAuthorized ? (
                <Link className="text-primary margin-right-1" to={`/users/${user?.id}`}>
                    {user?.email}
                </Link>
            ) : (
                <span></span>
            )}
        </span>
    );
};
