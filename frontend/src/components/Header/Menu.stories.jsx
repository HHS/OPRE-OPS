import { Menu } from "./Menu";
import { BrowserRouter as Router } from "react-router-dom";

const story = {
    title: "Header/Menu",
    component: Menu,
    argTypes: {},
};

export default story;

const Template = (args) => (
    <Router>
        <Menu {...args}></Menu>
    </Router>
);
export const Primary = Template.bind({});

Primary.args = {};
