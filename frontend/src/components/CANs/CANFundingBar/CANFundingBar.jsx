import styles from "./styles.module.css";
import { useEffect, useState } from "react";
import { calculateRatio } from "./util";

const CANFundingBar = ({ current_funding, expected_funding }) => {
    const [ratio, setRatio] = useState(1);

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: current_funding, expected: expected_funding });

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [current_funding, expected_funding]);

    return (
        <div className={styles.barBox}>
            <div className={styles.leftBar} style={{ flex: ratio }}></div>
            <div className={styles.rightBar}></div>
        </div>
    );
};

export default CANFundingBar;
