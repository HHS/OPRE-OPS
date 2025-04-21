import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("title", "This is required information", () => {
        enforce(data.title).isNotBlank();
    });
    test("description", "This is required information", () => {
        enforce(data.description).isNotBlank();
    });
    test("project_type", "This is required information", () => {
        enforce(data.project_type).isString().notEquals("0");
    });
});

export default suite;
