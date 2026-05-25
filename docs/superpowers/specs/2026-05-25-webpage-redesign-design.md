# 医疗器械 AI 知识库 — 前端视觉重设计规范

## 目标

将现有原生 HTML/CSS/JS 前端升级为 React + Tailwind CSS + shadcn/ui，提升整体专业产品感，保持现有蓝紫品牌色方向。

## 技术架构

| 层 | 选择 | 说明 |
|---|---|---|
| 框架 | React 18 + TypeScript | 组件化，替代当前 DOM 直接操作 |
| 构建 | Vite | 开发热更新，生产打包 |
| 样式 | Tailwind CSS + shadcn/ui | 原子化 CSS + 专业组件库 |
| 路由 | React Router v6 | 替代 CSS display toggle，支持 URL 导航 |
| 动画 | Tailwind 过渡 + framer-motion | 页面切换 + 微交互 |
| 字体 | Inter + Noto Sans SC | Google Fonts，替代 Fira Sans |
| 服务端 | Express（不变） | 新增 `express.static` 指向 Vite 构建产物 |

## 设计系统

### 色彩

保留现有品牌色方向（深蓝→紫色渐变），精炼如下：

- **主色**：`#0f2b6d`（深蓝，比现有 `#0c2873` 略深）
- **强调色**：`#7c3aed`（violet-600，接近现有 `#7733e6`）
- **背景**：`#f8fafc`（slate-50）
- **卡片**：纯白 `#ffffff` + `border-slate-200`
- **渐变品牌**：`linear-gradient(135deg, #022b71, #0f2b6d, #5b21b6)`
- **灰度**：Slate 色阶（slate-50 到 slate-900）
- **成功/危险/警告**：沿用现有绿/红/橙色

### 阴影（三层叠加）

```
卡片默认: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)
卡片悬浮: 0 4px 6px rgba(0,0,0,0.04), 0 12px 16px rgba(0,0,0,0.08)
模态框:   0 8px 24px rgba(0,0,0,0.08), 0 24px 48px rgba(0,0,0,0.12)
```

### 圆角

shadcn/ui 默认半径系统：sm: 6px, md: 8px, lg: 12px, xl: 16px

### 间距与排版

- 内容区最大宽度 `max-w-7xl`（1280px），大屏居中
- 页面标题：24px / 700
- 区块标题：16px / 600
- 正文：14px / 1.6
- 小字/标签：12px / 1.4

## 项目结构

```
src/
  components/
    ui/           -- shadcn/ui 基础组件
    layout/
      AppLayout.tsx
      Header.tsx
      Sidebar.tsx
    dashboard/
      StatCard.tsx
      ActionCard.tsx
      RecentConversations.tsx
    documents/
      UploadZone.tsx
      UploadProgress.tsx
      DocTable.tsx
      DocToolbar.tsx
      FileTypeBadge.tsx
    qa/
      ChatArea.tsx
      ChatBubble.tsx
      ChatInput.tsx
      ConvList.tsx
      SourceCard.tsx
      WelcomeScreen.tsx
    report/
      ReportForm.tsx
      ReportOutput.tsx
      TemplateSelector.tsx
    stats/
      TokenOverview.tsx
      DailyTable.tsx
      SystemInfo.tsx
  hooks/
    useSSE.ts
    useDebounce.ts
    useAuth.ts
  lib/
    api.ts       -- 从 api.js 迁移
    utils.ts
  pages/
    DashboardPage.tsx
    DocumentsPage.tsx
    QAPage.tsx
    ReportPage.tsx
    StatsPage.tsx
  App.tsx
  main.tsx
  index.css      -- Tailwind + 自定义品牌色 + 字体
```

## 各页面设计要点

### 布局（Header + Sidebar）

- **Header**：品牌渐变背景 + 微妙光泽叠加层（伪元素）。Logo 旁呼吸光效动画。Token 显示用 shadcn/ui Badge。退出按钮保持圆形图标
- **Sidebar**：激活项用左侧紫色指示条（3px）+ 淡紫背景（bg-violet-50），替代当前深蓝填充。hover 时滑动高亮过渡。文档计数用精致圆点 + 数字

### 仪表盘

- **统计卡片**：图标在彩色渐变圆形中，数据用 `text-3xl font-bold`，标签用 `text-xs uppercase tracking-wider text-muted-foreground`
- **快捷操作**：三张卡片，左侧大图标 + 标题 + 描述。hover: 边框变紫，上浮 4px
- **最近对话**：空状态 SVG 插画占位。有数据时显示可点击列表

### 文档管理

- **上传区**：点状动画虚线边框（pulse 动画）。拖拽悬停 → 紫淡背景 + 实色边框
- **进度条**：渐变填充，文件列表项含图标 + 状态标签
- **表格**：shadcn/ui Table。隔行交替色，sticky header，hover 行左侧紫色指示条。分页含页码选择
- **空状态**：居中插画 + "上传你的第一份文档" CTA 按钮

### 智能问答

- **对话列表**：搜索框在上，列表项含标题 + 日期。激活项左侧紫色指示条。删除按钮 hover 显示
- **欢迎页**：居中大图标 + 渐变标题 + 三个示例问题卡片（可点击填入）
- **消息气泡**：AI 左侧小头像 + 白底气泡，用户右侧小头像 + 品牌渐变气泡
- **来源卡片**：Accordion 折叠展开，片段含文档名 + 相关度彩色标签 + 文本预览
- **输入区**：textarea 自动增高，聚焦外圈紫色辉光。发送按钮输入为空时禁用半透明
- **流式输出**：三个跳动圆点加载动画

### 报告生成

- **表单**：shadcn/ui Select/Input/Textarea。生成中按钮变 loading spinner
- **输出区**：Typography（prose 风格），标题下淡色分隔线，引用块紫色左边框 + 淡紫背景
- **工具栏**：sticky 顶部，复制/下载按钮带 Tooltip，点击后对勾动画反馈

### 使用统计

- **Token 概览**：两个环形进度条 + 旁边具体数字，合计值大号紫色数字
- **每日统计表**：复用精致表格风格
- **系统信息**：icon + 标签 + 值列表，运行状态绿色脉冲圆点

## 兼容性要求

- 保持现有 Express 后端 API 不变（所有 /api/* 路由）
- SSE 流式通信机制复用，React 侧用 `useSSE` hook 封装
- Token 认证机制不变（sessionStorage + Authorization header）
- 初始化覆盖层（模型下载进度）保留，用 React 组件重写
- 响应式：768px 断点，侧边栏收窄为仅图标

## 不涉及范围

- 后端代码不做改动
- 数据库/LanceDB 不做改动
- 功能逻辑不做增减（纯视觉+体验升级）
- 不添加暗色模式（但 Tailwind dark: 类便于未来扩展）
