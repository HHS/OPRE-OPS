import { useEffect, useState, useMemo } from "react";

/**
 * Custom hook for managing ComboBox component state and functionality
 * @param {Array<Object>} data - The array of data items to populate the combobox options
 * @param {Object|null} selectedData - The currently selected data item
 * @param {Function} setSelectedData - Function to update the selected data in parent component
 * @param {Function} optionText - Function that returns the display text for each option
 * @param {Object} overrideStyles - Custom styles to override default combobox styles
 * @param {boolean} clearWhenSet - Whether to clear the selection after setting data
 */
const useComboBox = (data, selectedData, setSelectedData, optionText, overrideStyles, clearWhenSet, isMulti) => {
    const [selectedOption, setSelectedOption] = useState({ value: "", label: "" });
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        if (!isMulti) return;

        const handleKeyDown = (e) => {
            if (e.key === "Shift") setShiftHeld(true);
        };
        const handleKeyUp = (e) => {
            if (e.key === "Shift") setShiftHeld(false);
        };
        const handleBlur = () => setShiftHeld(false);

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleBlur);
        };
    }, [isMulti]);

    const options = useMemo(() => {
        if (!data || !Array.isArray(data)) {
            return [];
        }

        const mappedOptions = data.map((item) => {
            const option = {
                value: item.id,
                label: String(optionText(item))
            };
            // Only include order if explicitly present on the item
            if (item.order !== undefined) {
                option.order = item.order;
            }
            return option;
        });

        // Sort by order field if present, otherwise fall back to default sorting
        return mappedOptions.sort((a, b) => {
            // If both have explicit order property, sort by order
            if (a.order !== undefined && b.order !== undefined) {
                return a.order - b.order;
            }
            // if the label is a number, sort by number
            if (Number.isInteger(Number(a.label)) && Number.isInteger(Number(b.label))) {
                return Number(b.label) - Number(a.label);
            }
            // default is to sort alphabetically
            return a.label.localeCompare(b.label);
        });
    }, [data, optionText]);

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: state.isDisabled ? "#c9c9c9" : "#fff",
            borderColor: "#565c65",
            minHeight: "2.5rem",
            boxShadow: state.isFocused ? "" : "",
            outline: state.isFocused ? "0.25rem solid #2491ff" : "",
            borderRadius: 0,
            "&:hover": {
                borderColor: "#565c65"
            },
            ...overrideStyles
        }),

        placeholder: (provided, state) => ({
            ...provided,
            color: state.isDisabled ? "#454545" : "#565C65"
        }),

        singleValue: (provided, state) => ({
            ...provided,
            color: state.isDisabled ? "#454545" : provided.color
        }),

        valueContainer: (provided) => ({
            ...provided,
            padding: "0 6px"
        }),

        input: (provided, state) => ({
            ...provided,
            margin: "0px",
            color: state.isDisabled ? "#454545" : provided.color
        }),

        indicatorSeparator: () => ({
            display: "none"
        }),

        indicatorsContainer: (provided) => ({
            ...provided,
            height: "40px"
        }),

        clearIndicator: (provided) => ({
            ...provided,
            color: "#1b1b1b"
        }),

        dropdownIndicator: (provided) => ({
            ...provided,
            color: "#1b1b1b"
        }),

        multiValueLabel: (provided) => ({
            ...provided,
            color: "#1b1b1b"
        })
    };

    useEffect(() => {
        if (!selectedData || Object.keys(selectedData).length === 0) {
            setSelectedOption(null);
        }
    }, [selectedData]);

    const clear = () => {
        setSelectedData(null);
        setSelectedOption(null);
    };

    const clearWhenSetFunc = (optionId) => {
        if (!data || !Array.isArray(data)) {
            return;
        }
        // Handle both string and number IDs
        const optionObj = data.find((item) => item.id === optionId || item.id === Number(optionId));
        setSelectedData(optionObj); // Ensure this sets appropriately and resets where needed
        if (clearWhenSet) {
            setSelectedOption(null);
        }
    };

    const handleChangeDefault = (event) => {
        if (!data || !Array.isArray(data)) {
            return;
        }
        if (Array.isArray(event)) {
            const selectedOptionObjs = [];
            const selectedOptions = [];
            for (let e of event) {
                const optionId = e.value;
                // Handle both string and number IDs
                const optionObj = data.find((item) => item.id === optionId || item.id === Number(optionId));
                if (optionObj) {
                    selectedOptionObjs.push(optionObj);
                }

                const option = options.find((option) => option.value === optionId || option.value === Number(optionId));
                if (option) {
                    selectedOptions.push(option);
                }
            }
            setSelectedData(selectedOptionObjs);
            setSelectedOption(selectedOptions);
        } else {
            const optionId = event.value;
            // Handle both string and number IDs
            const optionObj = data.find((item) => item.id === optionId || item.id === Number(optionId));
            setSelectedData(optionObj);

            const option = options.find((option) => option.value === optionId || option.value === Number(optionId));
            setSelectedOption(option);
        }
    };

    const handleChange = (e, actionObj) => {
        if (actionObj.action === "clear") {
            clear();
        } else if (clearWhenSet) {
            clearWhenSetFunc(e.value);
        } else {
            handleChangeDefault(e);
        }
    };

    let defaultOption = selectedData
        ? Array.isArray(selectedData)
            ? selectedData
                  .map((item) => options.find((option) => option.value === item.id || option.value === Number(item.id)))
                  .filter(Boolean)
            : options.find((option) => option.value === selectedData?.id || option.value === Number(selectedData?.id))
        : null;

    return {
        selectedOption,
        setSelectedOption,
        options,
        customStyles,
        clear,
        clearWhenSetFunc,
        handleChangeDefault,
        handleChange,
        defaultOption,
        shiftHeld
    };
};
export default useComboBox;
