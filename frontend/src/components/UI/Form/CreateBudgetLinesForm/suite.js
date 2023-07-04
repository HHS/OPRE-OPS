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
        enforce(data.selectedCan).greaterThan(0);
    });
});

export default suite;
