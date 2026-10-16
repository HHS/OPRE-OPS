import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TRAIL_STATE_KEY, trailMatchesPath } from "../../../helpers/breadcrumb.helpers";
import { useBreadcrumbTrail } from "../../../hooks/useBreadcrumbTrail.hooks";
import { clearState, setIsActive } from "./alertSlice";

/**
 * @component A component that displays an alert and optionally navigates after a delay.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} [props.children] - The alert content.
 * @returns {JSX.Element | null} The JSX element to render.
 */
const Alert = ({ children }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    /**
     * @type {import('../../../hooks/use-alert.hooks').AlertData}
     */
    const { heading, message, type, redirectUrl, isCloseable, isToastMessage } = useSelector((state) => state.alert);
    const [isFromRedirect, setIsFromRedirect] = useState(false);
    const [isAlertVisible, setIsAlertVisible] = useState(true);
    const waitTime = 6000;
    const trail = useBreadcrumbTrail();

    // Handle navigation without blocking user interactions
    useEffect(() => {
        if (redirectUrl) {
            setIsFromRedirect(true);
            // Keep the breadcrumb trail when redirecting within the same resource
            // (e.g. award approval → that agreement's procurement tracker).
            const state = trailMatchesPath(trail, redirectUrl) ? { [TRAIL_STATE_KEY]: trail } : undefined;
            navigate(redirectUrl, { state });
        }

        return () => {
            setIsFromRedirect(false);
        };
        // Only a new redirectUrl should trigger navigation; `trail` is read at that moment.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, redirectUrl]);

    // Manage alert visibility and auto-dismiss without affecting navigation
    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(clearState());
            setIsAlertVisible(false);
        }, waitTime);

        return () => clearTimeout(timer);
    }, [dispatch, waitTime]);

    const typeClass =
        {
            success: "usa-alert--success",
            warning: "usa-alert--warning",
            error: "usa-alert--error",
            emergency: "usa-alert--emergency",
            info: "usa-alert--info"
        }[type] || "";

    const handleRole = () => {
        if (type === "emergency" || type === "error") {
            return "alert";
        }
        if (type === "success") {
            return "status";
        }
        return "";
    };

    return isAlertVisible ? (
        <>
            {isFromRedirect && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        backgroundColor: "rgba(255, 255, 255, 0.6)",
                        zIndex: 999
                    }}
                />
            )}
            <div
                className={`grid-container usa-alert ${typeClass} margin-top-0 position-fixed ${!isToastMessage ? "pin-x" : ""} z-top`}
                role={handleRole()}
                data-cy="alert"
                style={{
                    ...(isToastMessage && {
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: "0%"
                    })
                }}
            >
                <div
                    className="usa-alert__body"
                    style={{ flexDirection: "row", justifyContent: "space-between" }}
                >
                    <div>
                        {heading && <h1 className="usa-alert__heading">{heading}</h1>}
                        <p
                            className="usa-alert__text"
                            style={{ whiteSpace: "pre-wrap" }}
                            dangerouslySetInnerHTML={{ __html: message }}
                        />
                        {children}
                    </div>
                    {isCloseable && (
                        <FontAwesomeIcon
                            icon={faClose}
                            className="height-2 width-2 margin-right-1 cursor-pointer usa-tooltip"
                            title="close"
                            data-position="top"
                            data-cy="close-alert"
                            onClick={() => {
                                dispatch(setIsActive(false));
                                setIsAlertVisible(false);
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    ) : null;
};

export default Alert;
