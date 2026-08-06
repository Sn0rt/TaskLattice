/**
 * Demo display name for the seeded project. The database forbids renaming a
 * project after creation, so the console presents the seed project (named
 * after the admin account) under a friendlier demo label instead.
 */
export function projectDisplayName(
  name: string | undefined,
  projectId?: string | undefined,
): string | undefined {
  if (projectId === "individual" || name === "admin") {
    return "Demo Project";
  }
  return name;
}
