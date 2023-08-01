import styles from "./DetailsTabs.module.scss";
import { useLocation, useNavigate } from "react-router-dom";
import React from "react";
import Modal from "../../UI/Modal";

const DetailsTabs = ({ agreementId, isEditMode, setIsEditMode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const selected = `font-sans-2xs text-bold ${styles.listItemSelected} margin-right-2 cursor-pointer`;
    const notSelected = `font-sans-2xs text-bold ${styles.listItemNotSelected} margin-right-2 cursor-pointer`;

    const paths = [
        {
            name: "",
            label: "Agreement Details",
        },
        {
            name: "/budget-lines",
            label: "Budget Lines",
        },
    ];

    const [showModal, setShowModal] = React.useState(false);
    const [modalProps, setModalProps] = React.useState({});
    const handleClick = (e) => {
        const pathName = e.currentTarget.getAttribute("data-value");
        if (!isEditMode) navigate(pathName);
        else {
            setShowModal(true);
            setModalProps({
                heading: "Are you sure you want to exit? Your changes will not be saved.",
                actionButtonText: "Exit Editing",
                secondaryButtonText: "Continue Editing",
                handleConfirm: () => {
                    console.log("confirm");
                    setIsEditMode(false);
                    navigate(pathName);
                },
            });
        }
    };

    const links = paths.map((path) => {
        const pathName = `/agreements/${agreementId}${path.name}`;
        const tabSelected = location.pathname == pathName;

        return (
            <button
                data-value={pathName}
                className={tabSelected ? selected : notSelected}
                key={pathName}
                onClick={handleClick}
            >
                {path.label}
            </button>
        );
    });

    return (
        <>
            {showModal && (
                <Modal
                    heading={modalProps.heading}
                    setShowModal={setShowModal}
                    actionButtonText={modalProps.actionButtonText}
                    secondaryButtonText={modalProps.secondaryButtonText}
                    handleConfirm={modalProps.handleConfirm}
                />
            )}
            <nav
                className={`margin-bottom-4 ${styles.tabsList}`}
                aria-label={"Agreement Tab Sections"}
                role={"navigation"}
            >
                {links}
            </nav>
        </>
    );
};

export default DetailsTabs;
