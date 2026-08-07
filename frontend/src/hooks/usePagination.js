import { useMemo, useState } from "react";

export default function usePagination(data = [], pageSize = 10) {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(
        1,
        Math.ceil(data.length / pageSize)
    );

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;

        return data.slice(start, start + pageSize);
    }, [data, page, pageSize]);

    function nextPage() {
        if (page < totalPages) {
            setPage(page + 1);
        }
    }

    function previousPage() {
        if (page > 1) {
            setPage(page - 1);
        }
    }

    function goToPage(pageNumber) {
        if (
            pageNumber >= 1 &&
            pageNumber <= totalPages
        ) {
            setPage(pageNumber);
        }
    }

    return {
        page,
        totalPages,
        paginatedData,
        nextPage,
        previousPage,
        goToPage,
    };
}
