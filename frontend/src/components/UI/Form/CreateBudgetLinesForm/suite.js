import { create, test, enforce, only } from "vest";

const suite = create((data, fieldName) => {
    only(fieldName);
    console.log(`data: ${JSON.stringify(data, null, 2)}`);

    test("enteredDescription", "This is required information", () => {
        enforce(data.enteredDescription).isNotBlank();
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan).isNotBlank();
    });
    test("selectedCan", "This is required information", () => {
        enforce(data.selectedCan.id).greaterThan(0);
    });
    test("enteredMonth", "This is required information", () => {
        enforce(data.enteredMonth).greaterThan(0);
    });
    test("enteredDay", "This is required information", () => {
        enforce(data.enteredDay).isNotBlank();
    });
    test("enteredYear", "This is required information", () => {
        enforce(data.enteredYear).isNotBlank();
    });
});

export default suite;
