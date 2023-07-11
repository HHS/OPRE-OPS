import React from "react";
import Modal from "react-modal";
import { useGetNotificationsByUserIdQuery } from "../../../api/opsAPI";
import jwt_decode from "jwt-decode";
import icons from "../../../uswds/img/sprite.svg";
import Notification from "../Notification";
import customStyles from "./NotificationCenter.module.css";

const NotificationCenter = () => {
    const [showModal, setShowModal] = React.useState(false);
    const currentJWT = localStorage.getItem("access_token");
    let userId = "";

    if (currentJWT) {
        const decodedJwt = jwt_decode(currentJWT);
        userId = decodedJwt["sub"];
    }

    const {
        data: notifications,
        error,
        isLoading,
    } = useGetNotificationsByUserIdQuery(userId, { pollingInterval: 5000 });

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Oops, an error occurred</div>;
    }

    Modal.setAppElement("#root");

    return (
        <>
            <svg
                className="usa-icon height-205 width-205"
                onClick={() => setShowModal(true)}
                id="notification-center-bell"
            >
                <use xlinkHref={`${icons}#notifications`}></use>
            </svg>

            <Modal
                isOpen={showModal}
                onRequestClose={() => setShowModal(false)}
                className={customStyles.Modal}
                overlayClassName={customStyles.Overlay}
                contentLabel="Notifications"
            >
                <div className="display-flex height-full">
                    <div className={customStyles.flexLeft}></div>

                    <div className={customStyles.flexRight}>
                        <div className={customStyles.closeButtonWrapper}>
                            <svg
                                className="usa-icon text-ink height-205 width-205 hover: cursor-pointer usa-tooltip"
                                onClick={() => setShowModal(false)}
                                id="notification-center-close"
                            >
                                <use xlinkHref={`${icons}#close`}></use>
                            </svg>
                        </div>

                        <div className={customStyles.headerSection}>
                            <h1 className="font-sans-lg">Notifications</h1>
                            <button
                                className={customStyles.clearButton}
                                onClick={() => {
                                    return true;
                                }}
                            >
                                <svg
                                    className={`${customStyles.clearButtonIcon} usa-icon text-primary height-205 width-205 hover: cursor-pointer usa-tooltip`}
                                    id="notification-center-clear-all"
                                >
                                    <use xlinkHref={`${icons}#close`}></use>
                                </svg>
                                Clear
                            </button>
                        </div>
                        {notifications.length > 0 && (
                            <ul className={customStyles.listStyle}>
                                {notifications.map((notification) => (
                                    <Notification key={notification.id} data={notification} />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default NotificationCenter;
