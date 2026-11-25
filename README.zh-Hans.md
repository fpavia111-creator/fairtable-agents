# Fairtable 餐饮智能体

*由 Claude 翻译，尚待母语人士审校。以英文 [README](README.md) 为准。*

32 个小型 MCP 智能体，服务于餐厅、酒吧、咖啡馆和多门店餐饮集团的后台。每个智能体只负责**一项工作**，例如实际与理论食材成本、小费池、外卖平台结算或过敏原矩阵，不能越界操作。它们读取您已经从收银系统、排班系统、供应商发票、外卖平台和预订系统导出的文件，在您的电脑上生成报告，并在任何涉及转账、发送消息或更改在用系统的操作之前，等待一位具名人员确认。

属于 Mythos Machines 的 Fair Agents。MIT 许可 · Node 20 或更高 · 仅本地文件 · 无需凭据 · 无依赖。软件免费；付费的是在您自己文件上的固定价格部署服务。

## 试用

```bash
npx -y fairtable-food-cost demo            # 实际与理论食材成本（虚构数据）
npx -y fairtable-delivery-payouts demo   # 外卖平台结算与订单核对
```

每个智能体都有基于虚构文件的 `demo`、带自有测试用例的 `eval`，以及 MCP 服务器（`npx -y <智能体> mcp --root <文件夹>`）。

## 智能体

**食材、采购与酒吧（9）：** `fairtable-food-cost`（实际与理论食材成本）、`fairtable-recipe-costs`（按最新价格计算配方成本）、`fairtable-price-creep`（供应商逐步涨价）、`fairtable-receiving-credits`（发票与收货、贷项核对）、`fairtable-inventory-counts`（盘点差异）、`fairtable-waste-log`（损耗记录）、`fairtable-pour-cost`（酒吧倒酒成本）、`fairtable-menu-engineering`（菜单工程）、`fairtable-stockouts`（售罄菜品）。

**前厅与现金（6）：** `fairtable-voids-comps`（作废与招待）、`fairtable-discounts-promos`（折扣与促销）、`fairtable-cash-drawers`（现金长短款）、`fairtable-stored-value`（礼品卡）、`fairtable-no-shows`（预订未到店）、`fairtable-catering-deposits`（宴会订金）。

**人工（5）：** `fairtable-tip-pooling`（小费池）、`fairtable-overtime`（加班、分段班次）、`fairtable-schedule-vs-actual`（排班与实际）、`fairtable-labor-dayparts`（按时段人工成本率）、`fairtable-meal-breaks`（休息与未成年人）。

**外卖、手续费、税与账单（6）：** `fairtable-delivery-payouts`（结算）、`fairtable-delivery-marketing`（营销费用）、`fairtable-card-fees`（刷卡手续费）、`fairtable-sales-tax`（销售税）、`fairtable-duplicate-invoices`（重复发票、科目编码）、`fairtable-utility-bills`（水电燃气）。

**合规与多门店（6）：** `fairtable-equipment-maintenance`（设备维护）、`fairtable-health-inspections`（卫生检查与许可证）、`fairtable-food-handler-cards`（健康证）、`fairtable-allergen-matrix`（过敏原矩阵）、`fairtable-prime-cost`（主要成本）、`fairtable-location-comparison`（门店对比）。

## 安全机制

- **一个智能体一项工作。** 其他任何工具名称都会被拦截。
- **有约束力的操作不会自动发生。** 不付款、不退款、不修改收银系统、不发布排班、不运行工资、不报税、不发送消息。草稿保存为 DRAFT；批准始终需要具名人员点击，即使在 Auto 模式下也是如此。
- **个人信息会被遮蔽。** 员工和顾客的姓名、电话、邮箱在返回给 AI 模型的结果中只显示为 `A.R.#3f9a2c` 这样的代码；保存在您电脑上的文件保留真实值。
- **仅本地文件**，不联网，在 `.fairtable/` 中保存哈希链审计日志。
- **规则由您决定。** 目标、阈值、工资、税率、休息规则和过敏原列表都是您自己文件中的设置。

## 测试

在 Windows 和 Node 24 上，817 项测试和 703 个评估用例全部通过（每个智能体至少 21 个）；恶意输入测试未发现问题。详见 [REVIEW-ver1.md](REVIEW-ver1.md)。

## 限制

命名导出的列结构根据对这些系统的了解编写，未在真实账户中核对。工资、税务、休息和卫生规则因国家和地区而异，需由专业人士确认。不构成法律、税务、劳动或食品安全建议。

MIT © 2026 Kurt Francisco
