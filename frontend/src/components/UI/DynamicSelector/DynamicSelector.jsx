import { useDispatch } from "react-redux";
import styles from "./DyanmicSelector.test.js";

const DynamicSelector = ({ labelText, comboTitle, items, selectedItem, handleChangeEvent }) => {
    const dispatch = useDispatch();

    const onChangeDynamicSelector = (event) => {
        dispatch(handleChangeEvent({ value: event.target.value }));
    };

    const dynamicSelectorClasses = `usa-select ${styles.dynamicSelector}`;

    return (
        <div className={styles.container}>
            <label className="usa-label" htmlFor="fruit">
                Project
            </label>
            <div className="usa-combo-box">
                <select
                    id="dynamicSelector-{labelText}"
                    className={dynamicSelectorClasses}
                    onChange={onChangeDynamicSelector}
                    value={selectedItem?.value}
                    data-placeholder={comboTitle}
                >
                    {items.map((item) => {
                        return (
                            <option key={item?.id} value={item?.id}>
                                {item?.title}
                            </option>
                        );
                    })}
                </select>
            </div>
        </div>
    );
};

export default DynamicSelector;
