export function getPrimaryRoleSlug({
  roles = [],
  isPlatformAdmin = false,
  isOrganizationOwner = false,
  school = null,
} = {}) {
  if (isPlatformAdmin) {
    return "super_admin";
  }

  // If we are an organization owner but we have "entered" a specific school,
  // we act as the proprietor for that school.
  if (isOrganizationOwner && school) {
    return "proprietor";
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
