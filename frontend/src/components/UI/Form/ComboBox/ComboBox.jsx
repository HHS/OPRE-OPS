import PropTypes from "prop-types";
import Select from "react-select";
import { useEffect, useState } from "react";
import _ from "lodash";

/**
 *  A comboBox.
 * @param {Object} props - The component props.
 * @param {string} props.namespace - A unique name to use as a prefix for id, name, class, etc.
 * @param {array} props.data - The data to choose from.
 * @param {Object} props.selectedData - The currently selected data item.
 * @param {Function} props.setSelectedData - A function to call when the selected item changes.
 * @param {string} [props.optionText] - The property of a data item that provides the option text.
 * @param {string} [props.defaultString] - Initial text to display in select (optional).
 * @returns {JSX.Element} - The rendered component.
 */
export const ComboBox = ({
    namespace,
    data,
    selectedData,
    setSelectedData,
    optionText = "title",
    defaultString = "",
}) => {
    const [selectedOption, setSelectedOption] = useState(null);

    const options = data.map((item) => {
        return { value: item.id, label: _.get(item, optionText) };
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

    const handleChange = (e, actionObj) => {
        if (actionObj.action === "clear") {
            setSelectedData({});
            setSelectedOption(null);
        } else {
            const optionId = e.value;
            const optionObj = data.find((item) => item.id === Number(optionId));
            setSelectedData(optionObj);

            const option = options.find((option) => option.value === Number(optionId));
            setSelectedOption(option);
        }
    };

    const defaultOption = selectedData ? options.find((option) => option.value === Number(selectedData?.id)) : null;

    return (
        <div className="" data-enhanced="true">
            <Select
                className="margin-0"
                classNamePrefix={namespace}
                data-cy={namespace}
                data-testid={namespace}
                name={namespace}
                tabIndex="0"
                value={defaultOption ?? selectedOption}
                onChange={handleChange}
                options={options}
                placeholder={defaultString}
                styles={customStyles}
                isSearchable={true}
                isClearable={true}
            />
        </div>
    );
};

export default ComboBox;

ComboBox.propTypes = {
    namespace: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired,
    selectedData: PropTypes.object,
    setSelectedData: PropTypes.func.isRequired,
    optionText: PropTypes.string,
    legendClassname: PropTypes.string,
    defaultString: PropTypes.string,
};
