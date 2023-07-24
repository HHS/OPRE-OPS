import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("short_title", "This is required information", () => {
        enforce(data.short_title).isNotBlank();
    });
    test("short_title", "Nickname must be 3 letters", () => {
        enforce(data.short_title).lengthEquals(3);
    });
    test("title", "This is required information", () => {
        enforce(data.title).isNotBlank();
    });
    test("description", "This is required information", () => {
        enforce(data.description).isNotBlank();
    });
    test("type", "This is required information", () => {
        enforce(data.type).isString().notEquals("0");
    });
});

export default suite;
