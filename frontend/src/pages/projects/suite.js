import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("nickname", "This is required information", () => {
        enforce(data.nickname).isNotBlank();
    });
    test("nickname", "Nickname must be 3 letters", () => {
        enforce(data.nickname).lengthEquals(3);
    });
    test("title", "This is required information", () => {
        enforce(data.title).isNotBlank();
    });
    test("description", "This is required information", () => {
        enforce(data.description).isNotBlank();
    });
});

export default suite;
