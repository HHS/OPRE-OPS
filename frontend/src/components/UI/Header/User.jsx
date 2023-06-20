import { Link } from "react-router-dom";
import { CheckAuth } from "../../Auth/auth";
import { useGetUserByIdQuery } from "../../../api/opsAPI";
import jwt_decode from "jwt-decode";

export const User = () => {
    const currentJWT = localStorage.getItem("access_token");
    const decodedJwt = jwt_decode(currentJWT);
    const userId = decodedJwt["sub"];
    const { data: user } = useGetUserByIdQuery(userId);
    const isAuthorized = CheckAuth() && user;
    return <span>{isAuthorized ? <Link to={`/users/${user?.id}`}>{user?.email}</Link> : <span></span>}</span>;
};
