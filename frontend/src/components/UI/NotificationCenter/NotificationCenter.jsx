import { useGetNotificationsByUserIdQuery } from "../../../api/opsAPI";
import Notification from "../Notification/Notification";
import jwt_decode from "jwt-decode";
import icons from "../../../uswds/img/sprite.svg";
import Modal from "../Modal";
import React from "react";

const NotificationCenter = () => {
    const [showModal, setShowModal] = React.useState(false);
    const currentJWT = localStorage.getItem("access_token");
    let userId = "";

    if (currentJWT) {
        const decodedJwt = jwt_decode(currentJWT);
        userId = decodedJwt["sub"];
    }

    const { data, error, isLoading } = useGetNotificationsByUserIdQuery(userId, { pollingInterval: 5000 });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Oops, an error occurred</div>;
    }

    return (
        <>
            <svg
                className="usa-icon text-primary height-205 width-205 hover: cursor-pointer usa-tooltip"
                onClick={() => setShowModal(true)}
                id="notification-center-bell"
            >
                <use xlinkHref={`${icons}#notifications`}></use>
            </svg>
            {showModal && (
                <Modal
                    heading="Notification Center"
                    description={data}
                    setShowModal={setShowModal}
                    actionButtonText="Close"
                    handleConfirm={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default NotificationCenter;
