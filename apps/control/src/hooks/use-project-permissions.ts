import { useDemoRole } from "@/hooks/use-demo-role";
import { useProject } from "@/hooks/use-project";
import type {
  ProjectPermissions,
  ProjectRole,
} from "@/types/project";

export function permissionsForRole(role: ProjectRole): ProjectPermissions {
  const isManager = role === "admin";
  const isCompliance = role === "compliance";
  return {
    canCreateAgents: !isCompliance,
    canCreateProject: isManager,
    canDeleteProject: role === "admin",
    canInviteMembers: isManager,
    canManageResources: isManager,
    canManageProject: isManager,
    // Compliance is a read-only auditor: traceability requires audit-log access.
    canViewAuditLogs: isManager || isCompliance,
    canViewResources: true,
  };
}

/**
 * Resolves the role used for all permission checks. A frontend-only demo
 * override ("view as") wins over the real project role so access control can
 * be demonstrated without backend support.
 */
export function useEffectiveProjectRole(role?: ProjectRole): ProjectRole {
  const { roleOverride } = useDemoRole();
  const { currentProject } = useProject();
  return roleOverride ?? role ?? currentProject?.role ?? "member";
}

export function useProjectPermissions(
  role?: ProjectRole,
): ProjectPermissions {
  return permissionsForRole(useEffectiveProjectRole(role));
}
