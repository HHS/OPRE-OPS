import { create, enforce, only, test } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName); // only run the tests for the field that changed

    test("servicesComponentSelect", "This is required information", () => {
        enforce(data.servicesComponentSelect).isNotBlank();
    });
});

export default suite;
