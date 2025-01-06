import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("budget-amount", "This is required information", () => {
        enforce(data["budget-amount"]).isNotBlank();
    });

    test("funding-received-amount", "This is required information", () => {
        enforce(data["funding-received-amount"]).isNotBlank();
    });

    test("funding-received-amount", "Amount cannot exceed FY Budget", () => {
        const fundingReceivedAmount = data["funding-received-amount"].replace(/,/g, "");
        enforce(fundingReceivedAmount).lessThanOrEquals(data.submittedAmount);
    });
});

export default suite;
