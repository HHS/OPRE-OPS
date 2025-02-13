import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);
    console.log({ data });
    test("funding-received-amount", "Amount cannot exceed FY Budget", () => {
        const fundingReceivedAmount = data["funding-received-amount"].replace(/,/g, "") || "0";

        enforce(fundingReceivedAmount).lessThanOrEquals(data.remainingAmount);
    });

    test("budget-amount", "Amount must be greater than or equal to received funding", () => {
        const budgetAmount = data["budget-amount"].replace(/,/g, "") || "0";

        enforce(budgetAmount).greaterThanOrEquals(data.receivedFunding);
    });
});

export default suite;
