export function getPrimaryRoleSlug({ roles, isPlatformAdmin }) {
    if (isPlatformAdmin) {
        return "super_admin";
    }

    return roles?.[0]?.slug || "guest";
}

export function formatRoleLabel(roleSlug) {
    if (roleSlug === "super_admin") {
        return "Software Owner";
    }

    if (!roleSlug || roleSlug === "guest") {
        return "Guest";
    }

    return roleSlug
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
