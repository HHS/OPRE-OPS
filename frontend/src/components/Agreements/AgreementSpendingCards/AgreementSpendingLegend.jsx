import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CurrencyFormat from "react-currency-format";
import { AGREEMENT_TYPE_ORDER } from "./AgreementSpendingCards.constants";
import styles from "./AgreementSpendingLegend.module.scss";

const AgreementSpendingLegend = ({ agreementTypes = [], activeId = null }) => {
    if (!agreementTypes || agreementTypes.length === 0) {
        return null;
    }

    return (
        <div
            className={styles.legendGrid}
            data-testid="agreement-spending-legend"
        >
            {AGREEMENT_TYPE_ORDER.map((config) => {
                const typeData = agreementTypes.find((at) => at.type === config.type);
                const total = typeData?.total || 0;
                const newAmount = typeData?.new || 0;
                const continuingAmount = typeData?.continuing || 0;
                const isNewActive = activeId === config.type;
                const isContActive = activeId === `${config.type}_CONTINUING`;
                const newBoldClass = isNewActive ? "fake-bold" : "";
                const contBoldClass = isContActive ? "fake-bold" : "";

                return (
                    <div
                        key={config.type}
                        className={styles.legendColumn}
                        data-testid={`agreement-spending-legend-${config.type}`}
                    >
                        <div className={styles.legendHeader}>
                            <span className={styles.typeLabel}>{config.label}</span>
                            <CurrencyFormat
                                value={total}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale
                                renderText={(value) => <span className={styles.totalValue}>{value}</span>}
                            />
                        </div>
                        <div className={styles.subRow}>
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={styles.colorDot}
                                style={{ color: config.color }}
                            />
                            <span className={`${styles.subValue} ${newBoldClass}`}>New</span>
                            <CurrencyFormat
                                value={newAmount}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale
                                renderText={(value) => (
                                    <span className={`${styles.subValue} ${newBoldClass}`}>{value}</span>
                                )}
                            />
                        </div>
                        <div className={styles.subRow}>
                            <FontAwesomeIcon
                                icon={faCircle}
                                className={styles.colorDot}
                                style={{ color: config.continuingColor }}
                            />
                            <span className={`${styles.subValue} ${contBoldClass}`}>Cont.</span>
                            <CurrencyFormat
                                value={continuingAmount}
                                displayType={"text"}
                                thousandSeparator={true}
                                prefix={"$"}
                                decimalScale={2}
                                fixedDecimalScale
                                renderText={(value) => (
                                    <span className={`${styles.subValue} ${contBoldClass}`}>{value}</span>
                                )}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AgreementSpendingLegend;
