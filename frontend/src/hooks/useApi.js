import { useEffect, useState } from "react";
import api from "../services/api";

export default function useApi(url, initialData = []) {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function fetchData() {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(url);

            setData(response.data.data ?? response.data);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [url]);

    return {
        data,
        loading,
        error,
        refresh: fetchData,
    };
}
