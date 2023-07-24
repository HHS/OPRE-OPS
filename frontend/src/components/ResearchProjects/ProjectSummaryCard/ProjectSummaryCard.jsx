const ProjectSummaryCard = ({ selectedResearchProject: { title } }) => {
    return (
        <div className="bg-base-lightest font-family-sans border-1px border-base-light radius-sm margin-y-7">
            <dl className="margin-0 padding-y-2 padding-x-3">
                <dt className="margin-0">Project</dt>
                <dd className="margin-0 text-bold margin-top-1" style={{ fontSize: "1.375rem" }}>
                    {title}
                </dd>
            </dl>
        </div>
    );
};

export default ProjectSummaryCard;
