import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("funding-received-amount", "Amount cannot exceed FY Budget", () => {
        const fundingReceivedAmount = data["funding-received-amount"].replace(/,/g, "") || "0";
        enforce(fundingReceivedAmount).lessThanOrEquals(data.submittedAmount);
    });
});

export default suite;
