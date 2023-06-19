import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { setIsActive, clearState } from "./alertSlice";

/**
 * A component that displays an alert.
 * @param {object} props - The component props.
 * @param {("success"|"warning"|"error")} props.type - The type of the alert to be styled.
 * @param {string} props.heading - The heading of the alert.
 * @param {string} props.message - The message of the alert.
 * @param {string} [props.navigateUrl] - The URL to navigate to - if any.
 * @returns {JSX.Element} The JSX element to render.
 * @see {@link https://designsystem.digital.gov/components/alerts/}
 */
export const Alert = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isActive = useSelector((state) => state.alert.isActive);
    const navigateUrl = useSelector((state) => state.alert.navigateUrl);
    const heading = useSelector((state) => state.alert.heading);
    const message = useSelector((state) => state.alert.message);
    const type = useSelector((state) => state.alert.type);
    let classNames = "usa-alert margin-left-neg-4 margin-right-neg-4";

    React.useEffect(() => {
        const showAlert = async () => {
            if (navigateUrl) {
                navigate(navigateUrl);
            }
            await new Promise((resolve) => setTimeout(resolve, 500));
            window.scrollTo(0, 0);
            dispatch(setIsActive(true));

            await new Promise((resolve) => setTimeout(resolve, 6000));
            dispatch(setIsActive(false));
            dispatch(clearState());
        };

        showAlert();
    }, [dispatch, navigate, navigateUrl]);

    switch (type) {
        case "success":
            classNames += " usa-alert--success";
            break;
        case "warning":
            classNames += " usa-alert--warning";
            break;
        case "error":
            classNames += " usa-alert--error";
            break;
        default:
    }

    return (
        isActive && (
            <div className={classNames}>
                <div className="usa-alert__body display-flex flex-justify">
                    <div>
                        <h1 className="usa-alert__heading">{heading}</h1>
                        <p className="usa-alert__text">{message}</p>
                    </div>
                    <FontAwesomeIcon
                        icon={faClose}
                        className="height-2 width-2 margin-right-1 hover: cursor-pointer usa-tooltip"
                        title="close"
                        data-position="top"
                        onClick={() => dispatch(setIsActive(false))}
                    />
                </div>
            </div>
        )
    );
};

export default Alert;
