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
  category: "Data" | "Developer Tools" | "Research";
  description: string;
  digest: string;
  endpoint: string;
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
    category: "Data",
    description: "Run governed read-only queries and return structured results.",
    digest: "sha256:9a76…12f4",
    endpoint: "https://skills.internal.example/sql-query.tar.zst",
    id: "skill-sql-query",
    name: "SQL Query",
    owner: "Data Platform",
    permissions: 2,
    status: "PUBLISHED",
    version: "1.4.2",
  },
  {
    bindings: 2,
    category: "Developer Tools",
    description: "Generate and revise code inside an approved workspace boundary.",
    digest: "Pending source check",
    endpoint: "https://skills.internal.example/code-generation.tar.zst",
    id: "skill-code-generation",
    name: "Code Generation",
    owner: "Developer Experience",
    permissions: 4,
    status: "DRAFT",
    version: "0.9.0",
  },
  {
    bindings: 11,
    category: "Research",
    description: "Collect public sources and produce citation-backed research notes.",
    digest: "sha256:4bd3…88a1",
    endpoint: "https://skills.internal.example/web-research.tar.zst",
    id: "skill-web-research",
    name: "Web Research",
    owner: "Knowledge Team",
    permissions: 3,
    status: "PUBLISHED",
    version: "2.1.0",
  },
];

export type McpServerPreview = {
  authReference: string;
  endpoint: string;
  id: string;
  name: string;
  parameters: string;
  status: "HEALTHY" | "UNCHECKED";
  tools: number;
  transport: "Streamable HTTP" | "SSE";
};

export const mcpServerPreviews: McpServerPreview[] = [
  {
    authReference: "vault://platform/github-readonly",
    endpoint: "https://mcp.internal.example/github",
    id: "mcp-github-tools",
    name: "GitHub Tools",
    parameters: '{\n  "toolsets": ["repos", "issues", "pull_requests"]\n}',
    status: "HEALTHY",
    tools: 18,
    transport: "Streamable HTTP",
  },
  {
    authReference: "vault://data/warehouse-reader",
    endpoint: "https://mcp.internal.example/warehouse/events",
    id: "mcp-data-warehouse",
    name: "Data Warehouse",
    parameters: '{\n  "database": "analytics",\n  "readOnly": true\n}',
    status: "UNCHECKED",
    tools: 7,
    transport: "SSE",
  },
];

export type KnowledgeSourcePreview = {
  authReference: string;
  description: string;
  endpoint: string;
  id: string;
  mode: "Hybrid" | "Vector" | "Keyword";
  name: string;
  status: "READY" | "UNCHECKED";
  topK: number;
};

export const knowledgeSourcePreviews: KnowledgeSourcePreview[] = [
  {
    authReference: "vault://knowledge/product-docs",
    description: "Published product specifications, runbooks, and release notes.",
    endpoint: "https://knowledge.internal.example/v1/search",
    id: "kb-product-docs",
    mode: "Hybrid",
    name: "Product Documentation",
    status: "READY",
    topK: 8,
  },
  {
    authReference: "vault://knowledge/incidents",
    description: "Resolved incident timelines and operational learning notes.",
    endpoint: "https://knowledge.internal.example/incidents/query",
    id: "kb-incident-history",
    mode: "Vector",
    name: "Incident History",
    status: "UNCHECKED",
    topK: 5,
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
