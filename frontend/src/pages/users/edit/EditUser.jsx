import { useParams } from "react-router-dom";
import { useGetUserByIdQuery } from "../../../api/opsAPI";
import App from "../../../App";
import EditUserForm from "../../../components/Users/UserInfoForm/EditUserForm";
import ErrorPage from "../../ErrorPage";

/**
 * @returns {React.ReactElement} - The rendered component.
 */
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
        return <ErrorPage />;
    }

    return (
        <App breadCrumbName={user?.email}>
            <EditUserForm user={user} />
        </App>
    );
};

export default UserDetail;
