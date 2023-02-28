import styles from "./styles.module.scss";
import { useEffect, useState } from "react";
import { calculateRatio } from "./util";

const CANFundingBar = ({ data = [], setActiveId = () => {} }) => {
    const [ratio, setRatio] = useState(1);
    const received_funding = data[0].value;
    const expected_funding = data[1].value;

    useEffect(() => {
        const calculatedRatio = calculateRatio({ received: received_funding, expected: expected_funding });

        // css/flex will throw a warning here if depending on the data calculatedRatio is NaN
        if (calculatedRatio !== undefined && !Number.isNaN(calculatedRatio)) {
            setRatio(calculatedRatio);
        }
    }, [received_funding, expected_funding]);

    return (
        <div className={styles.barBox}>
            <div
                className={styles.leftBar}
                style={{ flex: ratio, backgroundColor: data[0].color }}
                onMouseEnter={() => setActiveId(data[0].id)}
                onMouseLeave={() => setActiveId(0)}
            />
            <div
                className={`${styles.rightBar} ${ratio === 0 ? styles.rightBarFull : ""}`}
                style={{ backgroundColor: data[1].color }}
                onMouseEnter={() => setActiveId(data[1].id)}
                onMouseLeave={() => setActiveId(0)}
            />
        </div>
    );
};

export default CANFundingBar;
