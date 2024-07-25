import App from "../../../App";
import UserEmailComboBox from "../../../components/Users/UserEmailComboBox/index.js";
import { useGetDivisionsQuery } from "../../../api/opsAPI.js";

const UserAdmin = () => {
    const { data: divisions, error: errorDivisions, isLoading: isLoadingDivisions } = useGetDivisionsQuery();

    if (isLoadingDivisions) {
        return <div>Loading...</div>;
    }
    if (errorDivisions) {
        return <div>Oops, an error occurred</div>;
    }

    console.log("divisions", divisions);

    return (
        <App breadCrumbName="User Admin">
            <h1 className={`font-sans-2xl margin-0 text-brand-primary`}>User Management</h1>
            <div>
                <section className="display-flex flex-justify margin-top-3">
                    <UserEmailComboBox />
                </section>
            </div>
        </App>
    );
};

export default UserAdmin;
