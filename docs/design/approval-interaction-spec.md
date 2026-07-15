# Approval 交互设计 Spec

状态：Implemented prototype contract

版本：0.1

页面类型：Product Console

成熟度：`prototype`

界面语言：English

## L1 定位与意图

### 一句话定义

Approval 帮助请求人提交需要审批的资源变更，并持续看清当前处理步骤、责任人、最终决定和变更是否已经实际生效。

### 目标用户

- Requester：创建、保存和跟踪自己发起的请求。
- Approver：后续版本中审阅请求并作出决定；当前原型不提供审批操作。
- Auditor / Operator：通过历史记录理解决定与运行结果；当前原型仅展示预览信息。

### 场景清单

- 为 API Quota 变更发起审批请求。
- 为 Instance 变更发起审批请求。
- 为 Skill binding 变更发起审批请求。
- 查看仍在等待决定的请求。
- 查看已经批准或拒绝的历史请求。
- 理解请求当前步骤、当前责任人和后续可能结果。

### 非目标

- 当前原型不执行真实审批、部署或资源变更。
- 当前原型不提供 approver inbox、评论、转交、撤回或重新提交。
- Ticket List 不替代全局 Audit；它只解释请求自身的状态流。
- Approval 不把审批决定等同于资源已经部署成功。

### 行为边界

#### 始终

- 始终显示请求状态、当前步骤和当前责任人。
- 始终区分 `Approved`、`Change applied` 和 `Completed`。
- 始终说明预览数据没有持久化到后端。
- 始终使用面向用户的 `step`，不使用工作流内部术语 `node`。

#### 询问后

- 用户必须通过明确的 `Submit for Approval` 操作提交请求。
- 未来版本中的 Reject、Withdraw 和生产环境变更必须经过确认。

#### 永不

- 永不在仅获得审批决定时显示变更已经生效。
- 永不把未连接 API 的预览操作描述为真实成功。
- 永不向 Requester 展示仅属于 Approver 的可执行动作。
- 永不在请求摘要中暴露凭据、Token 或原始敏感配置。

## L2 信息架构

### 空间区域定义

#### 全局导航

`Approval` 分组包含：

1. `Raise Request`
2. `Ticket List`

#### Raise Request

- Page Header：功能定位和 `UI preview` 成熟度提示。
- Primary Form：资源类型、环境、目标、请求值和业务理由。
- Approval Path：当前步骤、当前责任人和下一可能结果。
- Action Area：`Save Draft` 与 `Submit for Approval`。

#### Ticket List

- Status Tabs：`Pending` 与 `History`。
- Request List：请求、目标、当前步骤或完成时间、状态。
- Request Summary：所选请求的状态流、责任人和结果说明。

### 区域边界规则

- Request List 负责选择，不在列表行中放置审批操作。
- Request Summary 只解释所选请求，不修改其他列表项。
- Approval Path 解释状态，不暗示后台已经持久化。
- 全局 Audit 负责跨资源审计，Ticket List 只负责请求上下文。

### 内容生长规则

- Desktop 使用列表/表单加右侧详情栏；详情栏可在宽屏保持可见。
- Mobile 按 Header、Tabs、List/Form、Summary 的顺序单列排列。
- 长目标名称截断，但请求 ID、状态和当前步骤必须保持可读。
- 请求数量增长后使用分页或虚拟列表，不无限拉长首屏。
- 新的请求类型通过类型配置扩展，不在通用表单中保留无关字段。

## L3 核心链路

### 状态清单

#### Request lifecycle

- `DRAFT`：只存在于请求人编辑上下文。
- `PENDING`：已提交，等待当前责任人决定。
- `APPROVED`：审批已通过，但变更可能尚未应用。
- `REJECTED`：审批被拒绝，不会执行变更。
- `APPLYING`：未来后端开始应用已批准的变更。
- `COMPLETED`：决定和后续变更结果均已结束。
- `FAILED`：未来后端应用变更失败，需要恢复或人工处理。

### 主链路

1. 用户进入 `Raise Request`。
2. 用户选择 Request type、Environment 和 Target。
3. 表单只显示与类型相关的请求字段。
4. 用户填写 Business justification。
5. 用户选择 `Submit for Approval`。
6. 页面明确反馈请求已进入 `Pending review`，并显示当前责任人。
7. 用户进入 `Ticket List / Pending` 跟踪当前步骤。
8. 请求得到决定后进入 `History`。
9. Approved 请求只有在变更应用成功后才显示 `Change applied`。

### 分支链路

- Save Draft：保持在当前页面，显示草稿已保存在本次预览会话中。
- Rejected：状态流结束于 `Rejected` 和 `Closed`，不出现 Provisioning。
- Approved：显示 `Approved`，随后才允许显示 `Change applied` 和 `Completed`。
- Validation error：保留输入、定位错误字段、说明修复方法。
- Backend error：保留输入，说明请求未提交，并提供 Retry。
- Permission denied：保持页面可读，隐藏或禁用提交动作并解释所需权限。

## L4 组件功能细节

### Request Type Select

- 定位：决定后续字段和审批路径语言。
- 默认：`API quota change`。
- 变更：清除旧类型的提交反馈并切换相关字段。
- 禁用：无可申请资源或无请求权限时禁用并解释原因。
- 错误：显示可操作的字段级说明。

### Request Form

- 定位：收集审批所需的最少信息。
- 默认：显示必填字段和类型相关字段。
- Focus：使用现有可见 `focus-visible` 样式。
- Loading：提交超过 300ms 时保持布局并禁用重复提交。
- Success：显示请求进入哪个步骤、由谁处理。
- Error：保留全部输入并提供重试。

### Save Draft

- 默认：次要按钮。
- 激活：保存当前原型会话内容并显示状态反馈。
- 禁用：没有任何可保存内容时禁用。
- 永不：显示为已持久化到服务器，除非 Draft API 已连接。

### Submit for Approval

- 默认：页面唯一主操作。
- Hover / Focus：沿用 Button 系统状态。
- Loading：禁止重复提交并显示明确进度。
- Success：切换 Approval Path 到 `Pending review`。
- Error：停留在表单并提供恢复动作。

### Pending / History Tabs

- 默认：`Pending`。
- Selected：使用边框和文字权重，不只依赖颜色。
- Keyboard：使用 tab 语义，并支持标准键盘焦点。
- Empty：显示对应范围内没有请求，而不是空白表格。

### Request Row

- 默认：显示 Request ID、类型、目标、步骤/时间和状态。
- Hover / Focus：提供可见行反馈。
- Selected：左侧强调线、背景和 `aria-pressed` 同时表达选择。
- Disabled：当前原型不提供行级 mutation。

### Request Summary

- 定位：解释所选请求，不承担审批操作。
- Pending：突出当前步骤和 Waiting on。
- Approved：显示决定和变更应用结果。
- Rejected：显示 Closed，不显示 Provisioning。
- API 未连接：`View Request` 禁用并显示原因。

## L5 边界条件

### 空态

- Pending：`No requests are waiting for a decision.`
- History：`No completed requests yet.`
- 无可选 Target：解释缺少可申请资源，并引导返回资源列表。

### 加载态

- 300ms 内不显示闪烁 Loader。
- 300ms–2s 保留列表/表单布局并显示稳定占位。
- 超过 2s 显示正在加载的对象和可理解的状态说明。
- 超过 10s 提供 Retry。

### 错误态

- 明确什么失败、什么没有改变、是否可以安全重试。
- 提交错误保留用户输入。
- 列表错误不清除最后一次成功加载的请求。

### 权限降级

- 无创建权限：可查看列表，但提交按钮禁用并解释权限要求。
- 仅本人范围：Pending / History 只显示当前用户发起的请求。
- Auditor：只读访问历史及状态流。
- Approver：未来在同一 Request Detail 中显示角色专属操作；当前原型不伪造这些操作。

## L6 验收标准

### Given / When / Then

#### 创建请求

- Given 用户正在填写 API quota change，When 点击 `Submit for Approval`，Then 页面显示 `Pending review`、当前责任人，并明确变更尚未应用。
- Given 用户切换到 Instance change，When 表单更新，Then 不再显示 RPM/TPM 字段，而显示 Instance 相关的变更说明。
- Given 用户点击 `Save Draft`，When 操作完成，Then 页面显示仅保存于本次预览会话的反馈，不宣称服务器已持久化。

#### 跟踪请求

- Given 用户进入 Ticket List，When 默认加载完成，Then `Pending` 被选中，并只显示尚未结束的请求。
- Given 用户选择 Pending 请求，When Summary 更新，Then 当前步骤和 Waiting on 与所选请求一致。
- Given 用户切换到 History 并选择 Rejected 请求，When 状态流显示，Then 不出现 Provisioning 或 Change applied。
- Given 用户选择 Approved 请求，When 状态流显示，Then Approval decision 与 Change applied 是两个不同步骤。

#### 响应式与可访问性

- Given 390px viewport，When 打开 Approval 页面，Then 页面无横向溢出，表单、列表和详情按单列顺序可访问。
- Given 键盘用户，When 遍历 Tabs、Rows 和 Actions，Then 所有控件有可见焦点和可理解名称。
- Given 任一主操作，When 状态变化，Then 页面产生可见且可被辅助技术读取的反馈。

### 设计完成定义

- UI 文案使用 `Approval`、`Request`、`Step` 和 `Waiting on`，不使用含糊的 `Approve` 分组或内部术语 `node`。
- Raise Request 与 Ticket List 使用同一状态语言。
- Preview 行为明确标注，不宣称后端持久化。
- Default、selected、focus、disabled、success、empty 和 error 状态有实现或明确 gap。
- Typecheck、tests 和 production build 通过。
- Desktop 与 mobile 浏览器完成 overflow、broken assets、accessible names、small targets、console error 和点击反馈检查。
- 使用 Product Console 权重完成六维评分；`prototype` 总分至少 8.0，且没有 `wrong_domain_logic`、`broken_key_task_path`、`disconnected_controls_or_states` 或 `subcheck_evidence_missing` 阻塞项。

### Prototype 验收记录（2026-07-15）

| 维度 | 得分 | 证据 |
|---|---:|---|
| Product Intent | 10.0 | 主任务、Request 角色、Preview 非目标和主 CTA 均在首屏明确。 |
| Information Architecture | 9.0 | Raise Request 与 Ticket List 均使用主区域加 Summary；移动端列表补充 Target 和 Current step。 |
| System Craft | 8.5 | 复用项目 Card、Button、Select、StatusDot 和语义 Token；主操作达到 44px，仍缺真实异步 Skeleton。 |
| Trust & Domain Fit | 10.0 | 明确区分 Decision、Change applied、Completed；Rejected 路径不出现 Provisioning。 |
| Interaction Readiness | 8.5 | Save Draft、Submit、Pending/History、选择请求和拒绝分支均有反馈；真实 API 错误恢复留待集成。 |
| Visual & Brand Expression | 8.5 | 使用克制的控制台层级、单一主强调和一致状态表达，桌面与移动端均无溢出。 |

Product Console 加权得分：`9.21 / 10`。

Prototype blockers：无。

Release gate gaps：Approval API、权限矩阵、真实加载/错误/重试、空数据 Fixture，以及 Request Type 的浏览器自动化分支证据尚未接入。
