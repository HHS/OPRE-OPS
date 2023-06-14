import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("agreement_title", "This is required information", () => {
        enforce(data.agreement_title).isNotBlank();
    });
});

export default suite;
