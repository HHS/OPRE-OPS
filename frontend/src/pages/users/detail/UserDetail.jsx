import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import { setUser } from "./userSlice";
import UserInfo from "../../../components/Users/UserInfo/UserInfo";
import { getUser } from "../../../api/getUser";

const UserDetail = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.userDetail.user);
    const activeUser = useSelector((state) => state.auth.activeUser);
    const urlPathParams = useParams();
    const userId = parseInt(urlPathParams.id);

    useEffect(() => {
        const getUserAndSetState = async (userId) => {
            const results = await getUser(userId);
            dispatch(setUser(results));
        };

        getUserAndSetState(userId).catch(console.error);
    }, [dispatch, userId]);

    return (
        <App breadCrumbName={user?.email}>
            <UserInfo
                user={user}
                isEditable={activeUser?.roles.includes("USER_ADMIN")}
            />
        </App>
    );
};

export default UserDetail;
