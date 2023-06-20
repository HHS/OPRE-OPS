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
            <span className={`flex-3`}>
                <div className={"display-block"}>Methodologies</div>
                {researchProject.methodologies?.map((methodology) => (
                    <div key={methodology} className={"margin-top-1 display-inline-flex margin-right-1"}>
                        <Tag text={methodology} tagStyle="lightTextDarkBackground" />
                    </div>
                ))}
            </span>
            <span className={`flex-4`}>
                <div className={"display-block"}>Populations</div>
                {researchProject.populations?.map((population) => (
                    <div key={population} className={"margin-top-1 display-inline-flex margin-right-1"}>
                        <Tag text={population} tagStyle="lightTextDarkBackground" />
                    </div>
                ))}
            </span>
        </div>
    );
};

export default HeroFooter;
