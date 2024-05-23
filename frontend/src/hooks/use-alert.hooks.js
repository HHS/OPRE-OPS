import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { setAlert as SetAlertAction } from "../components/UI/Alert/alertSlice";

/**
 * The shape of the object that represents alert data.
 * @typedef {Object} AlertData
 * @property {string} type - The type of alert to display.
 * @property {string} heading - The heading of the alert.
 * @property {string} message - The message to display in the alert.
 * @property {string} [redirectUrl] - The URL to redirect to when the alert is dismissed.
 */

/**
 * The shape of the object returned by the useAlert hook.
 * @typedef {Object} AlertHook
 * @property {function} showAlert - A function that sets the alert data in the Redux store.
 * @property {boolean} isAlertActive - A boolean indicating if an alert is active.
 */
const useAlert = () => {
    const dispatch = useDispatch();
    const isAlertActive = useSelector((state) => state.alert.isActive);

    /**
     * Sets the alert data in the Redux store.
     * @param {AlertData} alertData - The data for the alert to be displayed.
     */
    const setAlert = (alertData) => {
        dispatch(SetAlertAction(alertData));
    };

    return { setAlert, isAlertActive };
};

useAlert.propTypes = {
    setAlert: PropTypes.func.isRequired,
    isAlertActive: PropTypes.bool.isRequired
};
export default useAlert;
