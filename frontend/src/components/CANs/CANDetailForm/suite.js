import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("can-nickName", "This is required information", () => {
        enforce(data["can-nickName"]).isNotBlank();
    });
});

export default suite;
