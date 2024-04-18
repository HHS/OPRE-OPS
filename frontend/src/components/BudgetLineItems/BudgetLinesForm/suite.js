import { create, test, enforce } from "vest";

const suite = create((data) => {
    // uncomment to test only one field at a time which breaks the group validation
    // only(fieldName);
    test("allServicesComponentSelect", "This is required information", () => {
        enforce(data.servicesComponentId).greaterThan(0);
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan).isNotBlank();
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan.id).greaterThan(0);
    });
    test("enteredAmount", "This is required information", () => {
        enforce(data.enteredAmount).isNotBlank();
    });
    test("enteredAmount", "This is required information", () => {
        enforce(data.enteredAmount).isNotEmpty();
    });
    test("needByDate", "This is required information", () => {
        enforce(data.needByDate).isNotBlank();
    });
    test("needByDate", "Date must be MM/DD/YYYY", () => {
        enforce(data.needByDate).matches(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/);
    });
    test("needByDate", "Date must be in the future", () => {
        const today = new Date();
        const enteredDate = new Date(data.needByDate);
        enforce(enteredDate.getTime()).greaterThan(today.getTime());
    });
});

export default suite;
