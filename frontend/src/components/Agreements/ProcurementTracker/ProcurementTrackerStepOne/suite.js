import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);
    // console.log({ data });
    test("users_combobox", "This is required information", () => {
        enforce(data.users_combobox).greaterThan(0);
    });
});

export default suite;
