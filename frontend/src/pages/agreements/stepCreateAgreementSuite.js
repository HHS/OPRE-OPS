import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("agreement-title", "This is required information", () => {
        enforce(data["agreement-title"]).isNotBlank();
    });
});

export default suite;
