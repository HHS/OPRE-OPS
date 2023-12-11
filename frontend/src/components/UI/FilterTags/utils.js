const createTagString = (selectedList, filterType, filterText, setTagsList) => {
    setTagsList((prevState) => prevState.filter((tag) => tag.filter !== filterType));
    if (selectedList.length > 0) {
        setTagsList((prevState) => {
            return [
                ...prevState,
                {
                    tagText: `${filterText} ${selectedList.join(", ")}`,
                    filter: filterType
                }
            ];
        });
    }
};

export default createTagString;
