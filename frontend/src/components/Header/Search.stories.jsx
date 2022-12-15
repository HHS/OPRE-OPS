import { Search } from "./Search";

const output = {
    title: "Header/Search",
    component: Search,
    argTypes: {},
};
export default output;

const Template = (args) => <Search {...args}></Search>;

export const Primary = Template.bind({});

Primary.args = {};
