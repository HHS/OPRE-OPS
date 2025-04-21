// frontend/src/components/UI/NotificationCenter/NotificationCenter.jsx
import React from "react";
import Modal from "react-modal";
import { useNotifications } from "../../../hooks/useNotifications";
import icons from "../../../uswds/img/sprite.svg";
import customStyles from "./NotificationCenter.module.css";
import LogItem from "../LogItem";

try {
    Modal.setAppElement("#root");
}
catch (error) {
    console.error("Error setting app element for Modal:", error);
}

const NotificationCenter = ({ user }) => {
    const [showModal, setShowModal] = React.useState(false);

    const {
      unreadNotifications,
      isLoading,
      dismissAll
    } = useNotifications(user?.oidc_id);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <svg
                className="usa-icon height-205 width-205 text-primary hover: cursor-pointer"
                onClick={() => setShowModal(true)}
                id="notification-center-bell"
            >
                {unreadNotifications?.length > 0 ? (
                    <use xlinkHref={`${icons}#notifications_active`}></use>
                ) : (
                    <use xlinkHref={`${icons}#notifications_none`}></use>
                )}
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
                                className="usa-icon text-ink height-205 width-205 cursor-pointer"
                                onClick={() => setShowModal(false)}
                                id="notification-center-close"
                            >
                                <use xlinkHref={`${icons}#close`}></use>
                            </svg>
                        </div>

                        <div className={customStyles.headerSection}>
                            <h1 className="font-sans-lg">Notifications</h1>
                            <button
                                id={"clear-all-button"}
                                className="usa-button usa-button--unstyled padding-right-2 text-no-underline display-flex align-items-center flex-align-center"
                                onClick={dismissAll}
                            >
                                <svg
                                    className={`${customStyles.clearButtonIcon} usa-icon text-primary height-205 width-205`}
                                    id="notification-center-clear-all"
                                >
                                    <use xlinkHref={`${icons}#close`}></use>
                                </svg>
                                Clear All
                            </button>
                        </div>
                        {unreadNotifications?.length > 0 ? (
                            <ul
                                className={customStyles.listStyle}
                                data-cy="notification-center-list"
                            >
                                {unreadNotifications?.map((notification) => (
                                    <LogItem
                                        key={notification.id}
                                        title={notification.title}
                                        createdOn={notification.created_on}
                                        message={notification.message}
                                        variant="large"
                                        withSeparator={true}
                                    />
                                ))}
                            </ul>
                        ) : (
                            <div className="padding-205">There are no notifications.</div>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default NotificationCenter;
