import PropTypes from "prop-types";
import Select from "react-select";
import { useEffect, useState } from "react";

/**
 *  A comboBox.
 * @param {Object} props - The component props.
 * @param {string} props.namespace - A unique name to use as a prefix for id, name, class, etc.
 * @param {array} props.data - The data to choose from.
 * @param {Object} props.selectedData - The currently selected data item.
 * @param {Function} props.setSelectedData - A function to call when the selected item changes.
 * @param {Function} [props.optionText] - A function to call that returns a string that provides the option text.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @param {Array<String>} [props.messages] - An array of error messages to display (optional).
 * @param {Object} [props.overrideStyles] - Some CSS styles to override the default (optional).
 * @param {boolean} [props.clearWhenSet] - Whether to clear the box when an option is selected.
 * @param {boolean} [props.isMulti] - Whether to allow multiple selections.
 * Used for TeamMemberComboBox. (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ComboBox = ({
    namespace,
    data,
    selectedData,
    setSelectedData,
    optionText = (data) => data.title,
    defaultString = "",
    messages = [],
    overrideStyles = {},
    clearWhenSet = false,
    isMulti = false,
}) => {
    console.log("data", data);
    const [selectedOption, setSelectedOption] = useState(null);

    const options = data.map((item) => {
        return { value: item.id, label: optionText(item) };
    });

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: "#fff",
            borderColor: "565c65",
            minHeight: "40px",
            height: "40px",
            boxShadow: state.isFocused ? null : null,
            outline: state.isFocused ? "0.25rem solid #2491ff" : null,
            borderRadius: 0,
            ...overrideStyles,
        }),

        placeholder: (provided) => ({
            ...provided,
            color: "#1b1b1b",
        }),

        valueContainer: (provided) => ({
            ...provided,
            height: "40px",
            padding: "0 6px",
        }),

        input: (provided) => ({
            ...provided,
            margin: "0px",
        }),

        indicatorSeparator: () => ({
            display: "none",
        }),

        indicatorsContainer: (provided) => ({
            ...provided,
            height: "40px",
        }),
    };

    useEffect(() => {
        selectedData === undefined && setSelectedOption(null);
    }, [selectedData]);

    const clear = () => {
        setSelectedData({});
        setSelectedOption(null);
    };

    const clearWhenSetFunc = (optionId) => {
        const optionObj = data.find((item) => item.id === Number(optionId));
        setSelectedData(optionObj);
        setSelectedOption(null);
    };

    const handleChangeDefault = (event) => {
        if (Array.isArray(event)) {
            const selectedOptionObjs = [];
            const selectedOptions = [];
            for (let e of event) {
                const optionId = e.value;
                const optionObj = data.find((item) => item.id === Number(optionId));
                selectedOptionObjs.push(optionObj);

                const option = options.find((option) => option.value === Number(optionId));
                selectedOptions.push(option);
            }
            setSelectedData(selectedOptionObjs);
            setSelectedOption(selectedOptions);
        } else {
            const optionId = event.value;
            const optionObj = data.find((item) => item.id === Number(optionId));
            setSelectedData(optionObj);

            const option = options.find((option) => option.value === Number(optionId));
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

    const defaultOption = selectedData ? options.find((option) => option.value === Number(selectedData?.id)) : null;

    return (
        <Select
            inputId={`${namespace}-input`}
            className={`padding-0 ${messages.length ? "usa-input--error" : null}`}
            classNamePrefix={namespace}
            name={namespace}
            tabIndex="0"
            value={defaultOption ?? selectedOption}
            onChange={handleChange}
            options={options}
            placeholder={defaultString}
            styles={customStyles}
            isSearchable={true}
            isClearable={true}
            isMulti={isMulti}
        />
    );
};

export default ComboBox;

ComboBox.propTypes = {
    namespace: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    selectedData: PropTypes.object,
    setSelectedData: PropTypes.func.isRequired,
    optionText: PropTypes.func,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
    messages: PropTypes.array,
    overrideStyles: PropTypes.object,
    clearWhenSet: PropTypes.bool,
    isMulti: PropTypes.bool,
};
