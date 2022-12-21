import constants from "../../../constants";
import { useDispatch, useSelector } from "react-redux";
import styles from "./FiscalYear.module.css";

const FiscalYear = ({ fiscalYear, handleChangeFiscalYear }) => {
    const dispatch = useDispatch();

    const onChangeFiscalYear = (event) => {
        dispatch(handleChangeFiscalYear({ value: event.target.value }));
    };

    const fiscalYearClasses = `usa-select ${styles.fiscalYearSelector}`;

    return (
        <select
            aria-label="Selected Fiscal Year"
            className={fiscalYearClasses}
            onChange={onChangeFiscalYear}
            value={fiscalYear?.value}
        >
            {constants.fiscalYears.map((year) => {
                return (
                    <option key={year} value={year}>
                        Fiscal Year {year}
                    </option>
                );
            })}
        </select>
    );
};

export default FiscalYear;
