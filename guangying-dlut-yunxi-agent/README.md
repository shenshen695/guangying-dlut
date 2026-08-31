# 光影大工

校园毕业影像地图与拍摄企划原型。用户填写风格、人数、时间、服装和步行接受度后，系统只从已录入的真实校园点位中生成路线，再交给 Leaflet 地图展示。

## 当前已实现

- 首页与四种毕业影像风格入口
- 6 个校园点位、1 条经典毕业路线
- Leaflet + 高德地图瓦片、点位卡片联动和路线播放
- 风格 Agent 对话、风格锁定、AI 穿搭与真实点位推荐
- 企划结果通过点位 ID 传给地图，避免编造地点
- 手机端地图底部信息卡
- Netlify Next.js 服务端部署

当前 `/planner` 页面作为风格页使用，Agent 通过服务端 `/api/agent` 调用模型；浏览器不会携带模型密钥。长期偏好使用 Supabase 保存，当前会话使用服务端内存保存。

## 数据流

```text
用户进入 /planner
  → 风格 Agent 读取短期对话与长期偏好
  → 服务端调用模型并校验风格、穿搭和真实点位
  → /result 展示锁定风格与 AI 推荐
  → /api/agent DELETE 支持重置会话和长期记忆
```

## 快速开始

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

生产构建：

```bash
npm run build
```

构建结果由 Netlify 的 Next.js 运行时托管，不需要上传 `out/`。

## 文件与代码的意义

### 页面 `app/`

| 文件 | 意义 |
| --- | --- |
| `app/layout.tsx` | 全站根布局、页面标题和全局样式入口。 |
| `app/globals.css` | Tailwind、Leaflet 样式、地图标记、路线和移动端抽屉样式。 |
| `app/page.tsx` | 首页；介绍产品，并把用户引向企划生成器或经典地图。 |
| `app/planner/page.tsx` | 风格页外壳；沿用站点 UI 并挂载对话 Agent。 |
| `app/result/page.tsx` | 展示锁定风格、AI 穿搭、场景和动作推荐。 |
| `app/map/page.tsx` | 地图页面的服务端外壳；提供加载状态。 |
| `app/route/[slug]/page.tsx` | 按路线 slug 展示完整路线和每站介绍。 |
| `app/spot/[slug]/page.tsx` | 按点位 slug 展示摄影攻略。 |

### 可复用组件 `components/`

| 文件 | 意义 |
| --- | --- |
| `components/MapPageClient.tsx` | 地图页总控制器；解析 URL、选择路线、播放路线、同步点位卡。 |
| `components/MapView.tsx` | Leaflet 地图本体；添加高德底图、标记和 GeoJSON 路线。 |
| `components/SpotCard.tsx` | 桌面端可复用的点位信息卡。 |

### 规划模块 `lib/planner/`

| 文件 | 意义 |
| --- | --- |
| `lib/planner/retrieveCandidates.ts` | 旧版真实点位检索逻辑，保留作后续路线规划扩展。 |
| `lib/planner/buildPlan.ts` | 旧版路线生成逻辑，保留作后续路线规划扩展。 |
| `lib/ai/prompts.ts` | 风格 Agent 的系统 Prompt、四种风格定义和真实点位白名单。 |
| `lib/db/preferences.ts` | Supabase 长期偏好读写、负反馈和重置。 |
| `lib/coordinates.ts` | 将 WGS84 坐标转换为高德地图使用的 GCJ-02，避免标记偏移。 |

### 数据 `data/`

| 文件 | 意义 |
| --- | --- |
| `data/spots.json` | 真实点位知识库：坐标、时间、人流、技巧、标签和步行等级。 |
| `data/routes.json` | 固定精品路线及点位顺序。 |

### 类型 `types/`

| 文件 | 意义 |
| --- | --- |
| `types/spot.ts` | 点位、摄影机位、人流等级的数据约束。 |
| `types/route.ts` | 路线的数据约束。 |
| `types/planner.ts` | 企划表单输入与结构化输出的数据约束。 |
| `types/geojson.ts` | 地图折线使用的 GeoJSON 类型。 |

### 工程配置

| 文件 | 意义 |
| --- | --- |
| `package.json` | 项目名称、开发/构建命令和依赖。 |
| `package-lock.json` | 锁定依赖版本，保证全队安装结果一致。 |
| `next.config.mjs` | Next.js 配置；已支持 Agent 服务端路由。 |
| `netlify.toml` | Netlify 构建命令。 |
| `tailwind.config.ts` | 页面配色、字体和扫描目录。 |
| `postcss.config.mjs` | Tailwind/PostCSS 编译配置。 |
| `tsconfig.json` | TypeScript 和 `@/` 路径别名配置。 |
| `.gitignore` | 排除依赖、构建产物、日志和真实环境变量。 |
| `.env.example` | 只列环境变量名称，不保存真实密钥。 |

## 团队协作约定

建议每个功能使用独立分支：

- `feat/map`：地图和点位交互
- `feat/planner`：企划与 AI 接入
- `feat/photographers`：摄影者目录
- `content/spots`：点位知识和授权素材

所有修改通过 Pull Request 合入 `main`。不要把真实 API Key、未经授权图片、`node_modules/`、`.next/` 或 `out/` 上传仓库。

## Agent 部署

这个版本已经取消 `output: "export"`，需要使用支持 Next.js 服务端路由的部署方式。Netlify 可以直接托管：构建命令为 `npm run build`，不要再设置 `publish = "out"`。

在 Netlify 后台配置以下环境变量：

```text
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.qnaigc.com/v1
OPENAI_MODEL=deepseek/deepseek-v4-flash-20260731
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

首次使用 Supabase 时，执行 `supabase/migrations/20260831011500_create_user_preferences.sql`。真实密钥只配置在本地 `.env.local` 或部署平台后台，不要提交到 GitHub。
