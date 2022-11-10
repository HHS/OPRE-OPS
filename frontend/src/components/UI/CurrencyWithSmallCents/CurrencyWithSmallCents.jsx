import CurrencyFormat from "react-currency-format";
import { getCents } from "./util";

const CurrencyWithSmallCents = ({ amount, dollarsClasses, centsClasses, centsStyles }) => (
    <div>
        <CurrencyFormat
            value={parseInt(amount).toString().padStart(2, "0")}
            displayType={"text"}
            thousandSeparator={true}
            prefix={"$ "}
            renderText={(value) => <span className={`${dollarsClasses} text-bold margin-bottom-0`}>{value}</span>}
        />
        <CurrencyFormat
            value={getCents(amount).toString().padStart(2, "0")}
            displayType={"text"}
            renderText={(value) => (
                <span className={`${centsClasses} text-bold margin-bottom-0`} style={centsStyles}>
                    .{value}
                </span>
            )}
        />
    </div>
);

export default CurrencyWithSmallCents;
