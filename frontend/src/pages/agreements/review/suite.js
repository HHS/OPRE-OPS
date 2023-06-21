import { create, test, enforce, only } from "vest";

const suite = create((fieldName) => {
    only(fieldName);

    test("description", "This is required information", () => {
        enforce(fieldName.description).isNotBlank();
    });
    test("psc", "This is required information", () => {
        enforce(fieldName.psc).isNotBlank();
    });
});

export default suite;
