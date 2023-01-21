import Tag from "../../UI/Tag/Tag";
import { useSelector } from "react-redux";

const HeroFooter = () => {
    const researchProject = useSelector((state) => state.researchProject.researchProject);

    const formatOptions = {
        month: "short",
        year: "numeric",
        day: "numeric",
    };

    const originationDate = new Date(researchProject.origination_date).toLocaleDateString("en-US", formatOptions);

    return (
        <div className={`margin-top-2 padding-0 display-flex text-bold font-sans-xs`}>
            <span className={`flex-2`}>
                Origination Date
                <div className={"margin-top-1"}>
                    <Tag text={originationDate} tagStyle="lightTextDarkBackground" />
                </div>
            </span>
            <span className={`flex-3`}>Methodologies</span>
            <span className={`flex-4`}>Populations</span>
        </div>
    );
};

export default HeroFooter;
