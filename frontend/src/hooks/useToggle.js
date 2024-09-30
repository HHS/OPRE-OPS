// use-toggle.js
import React from "react";

/**
 * A hook that returns a boolean value and a function to toggle it.
 *
 * @param {boolean | (() => boolean)} initialValue - The initial value of the boolean state.
 * @returns {[boolean, () => void]} - A tuple containing the boolean state and a function to toggle it.
 */
function useToggle(initialValue = false) {
    if (typeof initialValue !== "boolean" && typeof initialValue !== "function") {
        console.warn("Invalid type for useToggle");
    }
    const [value, setValue] = React.useState(initialValue);

    const handleToggle = () => {
        setValue(!value);
    };

    return [value, handleToggle];
}

export default useToggle;
