import { useGetNotificationsByUserIdQuery } from "../../../api/opsAPI";
import Notification from "../Notification/Notification";
import jwt_decode from "jwt-decode";

const NotificationCenter = () => {
    const currentJWT = localStorage.getItem("access_token");
    const decodedJwt = jwt_decode(currentJWT);
    const userId = decodedJwt["sub"];

    const { data, error, isLoading } = useGetNotificationsByUserIdQuery(userId, { pollingInterval: 5000 });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <>
            {data.map((item) => (
                <Notification key={item.id} data={item} />
            ))}
        </>
    );
};

export default NotificationCenter;
