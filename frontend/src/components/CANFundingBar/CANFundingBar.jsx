import styles from "./styles.module.css";
import { useEffect } from "react";
import { calculateRatio } from "./util";

const CANFundingBar = ({ current_funding, expected_funding }) => {
    useEffect(() => {
        const ratio = calculateRatio({ received: current_funding, expected: expected_funding });
        document.documentElement.style.setProperty("--can-funding-bar-ratio", ratio);
    }, [current_funding, expected_funding]);

    return (
        <div className={styles.barBox}>
            <div className={styles.leftBar}></div>
            <div className={styles.rightBar}></div>
        </div>
    );
};

export default CANFundingBar;
