import { useEffect, useState } from "react";

const useComboBox = (data, selectedData, setSelectedData, optionText, overrideStyles, clearWhenSet) => {
    // eslint-disable-next-line no-constant-binary-expression
    const [selectedOption, setSelectedOption] = useState(null || { value: "", label: "" });

    const options = data.map((item) => {
        return { value: item.id, label: optionText(item) };
    });

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            background: "#fff",
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

        placeholder: (provided) => ({
            ...provided,
            color: "#565C65"
        }),

        valueContainer: (provided) => ({
            ...provided,
            padding: "0 6px"
        }),

        input: (provided) => ({
            ...provided,
            margin: "0px"
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
        const optionObj = data.find((item) => item.id === Number(optionId));
        setSelectedData(optionObj); // Ensure this sets appropriately and resets where needed
        if (clearWhenSet) {
            setSelectedOption(null);
        }
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

    let defaultOption = selectedData
        ? Array.isArray(selectedData)
            ? selectedData.map((item) => options.find((option) => option.value === Number(item.id)))
            : options.find((option) => option.value === Number(selectedData?.id))
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
        defaultOption
    };
};
export default useComboBox;
