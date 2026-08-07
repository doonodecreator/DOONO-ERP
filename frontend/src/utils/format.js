export function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

export function formatCurrency(value) {
    return "₦" + Number(value || 0).toLocaleString();
}

export function capitalize(text) {
    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString();
}

export function badgeColor(status) {
    switch ((status || "").toLowerCase()) {
        case "active":
            return "#16a34a";

        case "inactive":
            return "#dc2626";

        case "pending":
            return "#ca8a04";

        default:
            return "#6b7280";
    }
}
