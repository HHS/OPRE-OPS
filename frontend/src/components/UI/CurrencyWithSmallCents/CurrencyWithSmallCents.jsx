import CurrencyFormat from "react-currency-format";
import { getCents } from "./util";

const CurrencyWithSmallCents = ({ amount, dollarsClasses, centsClasses, centsStyles }) => {
    const dollarValue = parseInt(amount) === 0 || isNaN(amount) ? "0" : parseInt(amount).toString();
    const centsValue = getCents(amount);

    const displayCents = dollarValue !== "0" || centsValue !== "00";

    return (
        <div>
            <CurrencyFormat
                value={dollarValue}
                displayType={"text"}
                thousandSeparator={true}
                prefix={"$ "}
                renderText={(value) => <span className={`${dollarsClasses} text-bold margin-bottom-0`}>{value}</span>}
            />
            {displayCents && (
                <CurrencyFormat
                    value={centsValue}
                    displayType={"text"}
                    renderText={(value) => (
                        <span className={`${centsClasses} text-bold margin-bottom-0`} style={centsStyles}>
                            .{value}
                        </span>
                    )}
                />
            )}
        </div>
    );
};

export default CurrencyWithSmallCents;
