import { useParams } from "react-router-dom";
import App from "../../../App";
import EditUserForm from "../../../components/Users/UserInfoForm/EditUserForm";
import { useGetUserByIdQuery } from "../../../api/opsAPI";

const UserDetail = () => {
    const urlPathParams = useParams();
    const userId = urlPathParams.id ? parseInt(urlPathParams.id) : undefined;

    const {
        data: user,
        error: errorAgreement,
        isLoading: isLoadingAgreement
    } = useGetUserByIdQuery(userId, { refetchOnMountOrArgChange: true });

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

    return (
        <App breadCrumbName={user?.email}>
            <EditUserForm user={user} />
        </App>
    );
};

export default UserDetail;
