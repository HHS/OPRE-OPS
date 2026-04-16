import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("title", "This is required information", () => {
        enforce(data["title"]).isNotBlank();
    });
});

export default suite;
