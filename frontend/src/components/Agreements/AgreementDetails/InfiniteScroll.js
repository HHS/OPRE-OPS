import { useEffect, useRef } from "react";

const InfiniteScroll = ({ fetchMoreData, isLoading }) => {
    const observerRef = useRef();

    const handleIntersection = (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading) {
            fetchMoreData();
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.1,
        });

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [observerRef, isLoading, fetchMoreData]);

    return (
        <div ref={observerRef} style={{ minHeight: "2em" }}>
            {isLoading && "Loading ..."}
        </div>
    );
};

export default InfiniteScroll;
