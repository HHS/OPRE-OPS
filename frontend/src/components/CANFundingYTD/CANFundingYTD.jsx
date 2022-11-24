import styles from "./styles.module.css";
import CurrencyWithSmallCents from "../UI/CurrencyWithSmallCents/CurrencyWithSmallCents";
import CANFundingBar from "../CANFundingBar/CANFundingBar";

const CANFundingYTD = (props) => {
    const gridRow = `grid-row`;
    const gridRowText = `grid-row ${styles.gridRowText}`;
    const barBox = `${styles.barBox}`;
    const rightAlign = `${styles.right}`;

    return (
        <div>
            <div className={gridRow}>
                <div className="grid-col-2">
                    <CurrencyWithSmallCents
                        amount="14000000.00"
                        dollarsClasses="font-sans-3xs text-bold"
                        centsStyles={{ fontSize: "8px" }}
                    />
                </div>
                <div className="grid-col-2 grid-offset-8">
                    <div className={rightAlign}>
                        <CurrencyWithSmallCents
                            amount="3000000.00"
                            dollarsClasses="font-sans-3xs text-bold"
                            centsStyles={{ fontSize: "8px" }}
                        />
                    </div>
                </div>
            </div>
            <div className={barBox}>
                <CANFundingBar />
            </div>
            <div className={gridRowText}>
                <div className="grid-col-2">
                    <span>Received</span>
                </div>
                <div className="grid-col-2 grid-offset-8">
                    <span className={rightAlign}>Expected</span>
                </div>
            </div>
        </div>
    );
};

export default CANFundingYTD;
