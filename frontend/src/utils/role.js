export function getPrimaryRoleSlug({
  roles = [],
  isPlatformAdmin = false,
  isOrganizationOwner = false,
} = {}) {
  if (isPlatformAdmin) {
    return "super_admin";
  }

  if (isOrganizationOwner) {
    return "organization_owner";
  }

  return roles?.[0]?.slug || "guest";
}

export function formatRoleLabel(roleSlug) {
  if (roleSlug === "super_admin") {
    return "Software Owner";
  }

  if (roleSlug === "organization_owner") {
    return "Organization Owner";
  }

  if (!roleSlug || roleSlug === "guest") {
    return "Guest";
  }

  return roleSlug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
