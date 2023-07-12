// @ts-nocheck
import { useSelector, useDispatch } from "react-redux";
import { getUser } from "../../../api/getUser";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import { Breadcrumb } from "../../../components/UI/Header/Breadcrumb";
import { setUser } from "./userSlice";
import UserInfoForm from "../../../components/Users/UserInfoForm/UserInfoForm";

const UserDetail = () => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.userDetailEdit.user);
    const urlPathParams = useParams();
    const userId = urlPathParams.id ? parseInt(urlPathParams.id) : undefined;

    useEffect(() => {
        const getUserAndSetState = async (userId) => {
            const results = await getUser(userId);
            dispatch(setUser(results));
        };

        getUserAndSetState(userId).catch(console.error);
    }, [dispatch, userId]);

    return (
        <>
            <App>
                <Breadcrumb currentName={user?.email} />
                <UserInfoForm user={user} />
            </App>
        </>
    );
};

export default UserDetail;
