import constants from "../../../constants";
import { useDispatch } from "react-redux";
import styles from "./FiscalYear.module.css";

const FiscalYear = ({ fiscalYear, handleChangeFiscalYear }) => {
    const dispatch = useDispatch();

    const onChangeFiscalYear = (event) => {
        dispatch(handleChangeFiscalYear({ value: event.target.value }));
    };

    const fiscalYearClasses = `usa-select ${styles.fiscalYearSelector}`;

    return (
        <div className={styles.container}>
            <label htmlFor="fiscal-year-select">Fiscal Year</label>
            <select
                id="fiscal-year-select"
                className={fiscalYearClasses}
                onChange={onChangeFiscalYear}
                value={fiscalYear?.value}
            >
                {constants.fiscalYears.map((year) => {
                    return (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

export default FiscalYear;
