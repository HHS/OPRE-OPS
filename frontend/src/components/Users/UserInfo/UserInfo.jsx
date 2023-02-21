import styles from "./UserInfo.module.css";
import RoundedBox from "../../UI/RoundedBox/RoundedBox";
import { useSelector } from "react-redux";

const UserInfo = () => {
    const user = useSelector((state) => state.activeUser.user);

    return (
        <div className={styles.container}>
            User Info:
            <RoundedBox>
                <div className="cardBody">
                    <table>
                        <tr>
                            <td>User ID</td>
                            <td>: {user?.id}</td>
                        </tr>
                        <tr>
                            <td>User Email</td>
                            <td>: {user?.email}</td>
                        </tr>
                        <tr>
                            <td>Name</td>
                            <td>: {user?.fullname}</td>
                        </tr>
                        <tr>
                            <td>Date Joined</td>
                            <td>: {user?.date_joined}</td>
                        </tr>
                        <tr>
                            <td>Role(s)</td>
                            <td>: {user?.role}</td>
                        </tr>
                        <tr>
                            <td>Division(s)</td>
                            <td>: {user?.division}</td>
                        </tr>
                    </table>
                </div>
            </RoundedBox>
        </div>
    );
};

export default UserInfo;
