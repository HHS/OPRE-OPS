import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    // Vendor validation
    test("vendor", "Vendor is required", () => {
        enforce(data.vendor).isNotNullish();
    });

    // Award Information validations
    test("contractNumber", "Contract # is required", () => {
        enforce(data.contractNumber).isNotEmpty();
    });

    test("awardAmount", "Award Amount is required", () => {
        enforce(data.awardAmount).isNotEmpty();
    });

    test("awardDate", "Award Date is required", () => {
        enforce(data.awardDate).isNotEmpty();
    });

    test("awardDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.awardDate || "").matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });
});

export default suite;
