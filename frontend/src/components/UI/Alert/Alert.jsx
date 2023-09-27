import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { setIsActive, clearState } from "./alertSlice";

/**
 * A component that displays an alert.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} [props.children] - The children to render.
 * @returns {React.JSX.Element} The JSX element to render.
 * @see {@link https://designsystem.digital.gov/components/alerts/}
 */
export const Alert = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const heading = useSelector((state) => state.alert.heading);
    const message = useSelector((state) => state.alert.message);
    const type = useSelector((state) => state.alert.type);
    const redirectUrl = useSelector((state) => state.alert.redirectUrl);

    React.useEffect(() => {
        if (redirectUrl) {
            navigate(redirectUrl);
        }

        const showAlert = async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            window.scrollTo(0, 0);

            await new Promise((resolve) => setTimeout(resolve, 5000));
            dispatch(clearState());
        };

        showAlert();
    }, [navigate, dispatch, redirectUrl]);

    let typeClass = null;
    switch (type) {
        case "success":
            typeClass = "usa-alert--success";
            break;
        case "warning":
            typeClass = "usa-alert--warning";
            break;
        case "error":
            typeClass = "usa-alert--error";
            break;
        default:
    }

    return (
        <div
            className={`grid-container usa-alert ${typeClass} margin-top-0 pin-x`}
            role="status"
            data-cy="alert"
        >
            <div className="usa-alert__body display-flex flex-justify">
                <div>
                    <h1 className="usa-alert__heading">{heading}</h1>
                    <p className="usa-alert__text">{message}</p>
                    {children}
                </div>

                <FontAwesomeIcon
                    icon={faClose}
                    className="height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                    title="close"
                    data-position="top"
                    onClick={() => dispatch(setIsActive(false))}
                />
            </div>
        </div>
    );
};

export default Alert;
