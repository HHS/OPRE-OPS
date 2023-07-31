// @ts-nocheck
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import App from "../../../App";
import { Breadcrumb } from "../../../components/UI/Header/Breadcrumb";
import EditUserForm from "../../../components/UI/Form/EditUserForm/EditUserForm";
import { useGetUserByIdQuery } from "../../../api/opsAPI";

const UserDetail = () => {
    //const dispatch = useDispatch();
    //const user = useSelector((state) => state.userDetailEdit.user);
    const urlPathParams = useParams();
    const userId = urlPathParams.id ? parseInt(urlPathParams.id) : undefined;

    const {
        data: user,
        error: errorAgreement,
        isLoading: isLoadingAgreement,
        refetch,
    } = useGetUserByIdQuery(userId, { refetchOnMountOrArgChange: true });

    useEffect(() => {
        refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoadingAgreement) {
        return (
            <App>
                <h1>Loading...</h1>
            </App>
        );
    }
    if (errorAgreement) {
        return (
            <App>
                <h1>Oops, an error occurred</h1>
            </App>
        );
    }
    // useEffect(() => {
    //     const getUserAndSetState = async (userId) => {
    //         const results = await getUser(userId);
    //         dispatch(setUser(results));
    //     };

    //     getUserAndSetState(userId).catch(console.error);
    // }, [dispatch, userId]);

    return (
        <>
            <App>
                <Breadcrumb currentName={user?.email} />
                <EditUserForm user={user} />
                {/* <UserInfoForm user={user} /> */}
            </App>
        </>
    );
};

export default UserDetail;
