import { create, test, enforce, only } from "vest";

const suite = create((data = {}, fieldName) => {
    only(fieldName);

    test("nickname", "Project nickname is required", () => {
        enforce(data.nickName).isNotBlank();
    });
    test("nickname", "Project nickname must be at least 3 characters", () => {
        enforce(data.nickName).longerThanOrEquals(3);
    });
    // test("title", "Project title is required", () => {
    //     enforce(data.project.title).isNotBlank();
    // });
    // test("title", "Project title must be at least 5 characters", () => {
    //     enforce(data.project.title).longerThanOrEquals(5);
    // });
});

export default suite;
