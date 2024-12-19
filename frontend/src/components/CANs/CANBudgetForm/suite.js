import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("budget-amount", "This is required information", () => {
        enforce(data["budget-amount"]).isNotBlank();
    });
});

export default suite;
