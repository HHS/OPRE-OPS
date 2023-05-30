import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("nickname", "This is required information", () => {
        enforce(data.nickname).isNotBlank();
    });
    test("title", "This is required information", () => {
        enforce(data.title).isNotBlank();
    });
    // test("description", "This is required information", () => {
    //     enforce(data.description).isNotBlank();
    // });
    // test("password", "This is required information", () => {
    //     enforce(data.description).isNotBlank();
    // });
});

export default suite;
