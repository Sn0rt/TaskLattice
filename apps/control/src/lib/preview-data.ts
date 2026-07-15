export type QuotaPreview = {
  endpoint: string;
  id: string;
  limit: string;
  model: string;
  status: "ACTIVE" | "DRAFT";
  usage: string;
};

export const quotaPreviews: QuotaPreview[] = [
  {
    endpoint: "api.deepseek.internal",
    id: "quota-deepseek-chat",
    limit: "600 RPM · 2M TPM",
    model: "deepseek-chat",
    status: "ACTIVE",
    usage: "68%",
  },
  {
    endpoint: "api.deepseek.internal",
    id: "quota-deepseek-reasoner",
    limit: "120 RPM · 800K TPM",
    model: "deepseek-reasoner",
    status: "DRAFT",
    usage: "—",
  },
  {
    endpoint: "embedding.platform.internal",
    id: "quota-embedding-v3",
    limit: "1K RPM · 5M TPM",
    model: "embedding-v3",
    status: "ACTIVE",
    usage: "42%",
  },
];

export type SkillPreview = {
  bindings: number;
  id: string;
  name: string;
  owner: string;
  permissions: number;
  status: "PUBLISHED" | "DRAFT";
  version: string;
};

export const skillPreviews: SkillPreview[] = [
  {
    bindings: 6,
    id: "skill-sql-query",
    name: "SQL Query",
    owner: "Data Platform",
    permissions: 2,
    status: "PUBLISHED",
    version: "1.4.2",
  },
  {
    bindings: 2,
    id: "skill-code-generation",
    name: "Code Generation",
    owner: "Developer Experience",
    permissions: 4,
    status: "DRAFT",
    version: "0.9.0",
  },
  {
    bindings: 11,
    id: "skill-web-research",
    name: "Web Research",
    owner: "Knowledge Team",
    permissions: 3,
    status: "PUBLISHED",
    version: "2.1.0",
  },
];

export type TicketPreview = {
  actionOwner: string;
  completedAt?: string;
  currentStep: string;
  id: string;
  kind: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  target: string;
};

export const pendingTicketPreviews: TicketPreview[] = [
  {
    actionOwner: "Platform Quota Approvers",
    currentStep: "Quota approval",
    id: "REQ-2026-0715",
    kind: "Quota increase",
    status: "PENDING",
    target: "deepseek-chat",
  },
  {
    actionOwner: "Security Review",
    currentStep: "Security review",
    id: "REQ-2026-0712",
    kind: "Skill binding",
    status: "PENDING",
    target: "SQL Query",
  },
];

export const historyTicketPreviews: TicketPreview[] = [
  {
    actionOwner: "Platform Operations",
    completedAt: "Jul 12",
    currentStep: "Completed",
    id: "REQ-2026-0688",
    kind: "Instance update",
    status: "APPROVED",
    target: "Research Assistant",
  },
  {
    actionOwner: "Platform Quota Approvers",
    completedAt: "Jul 08",
    currentStep: "Closed",
    id: "REQ-2026-0661",
    kind: "Quota request",
    status: "REJECTED",
    target: "embedding-v3",
  },
];

export const auditPreviews = [
  {
    action: "Quota edited",
    actor: "Priya Shah",
    resource: "deepseek-chat",
    result: "SUCCESS",
    time: "10:24",
  },
  {
    action: "Instance updated",
    actor: "Michael Chen",
    resource: "Research Assistant",
    result: "SUCCESS",
    time: "09:15",
  },
  {
    action: "Skill bound",
    actor: "James Lee",
    resource: "SQL Query",
    result: "SUCCESS",
    time: "Yesterday",
  },
  {
    action: "Request rejected",
    actor: "Anita Desai",
    resource: "REQ-2026-0661",
    result: "FAILED",
    time: "Yesterday",
  },
] as const;
