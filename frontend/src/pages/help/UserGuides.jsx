import ReactMarkdown from "react-markdown";
import Accordion from "../../components/UI/Accordion";

const UserGuides = () => {
    return (
        <>
            <h1>User Guide</h1>
            {data.map((item) => (
                <Accordion
                    key={item.heading}
                    heading={item.heading}
                >
                    <ReactMarkdown>{item.content}</ReactMarkdown>
                </Accordion>
            ))}
        </>
    );
};

const data = [];

export default UserGuides;
