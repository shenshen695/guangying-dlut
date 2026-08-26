# 光影大工

校园毕业影像地图与拍摄企划原型。用户填写风格、人数、时间、服装和步行接受度后，系统只从已录入的真实校园点位中生成路线，再交给 Leaflet 地图展示。

## 当前已实现

- 首页与四种毕业影像风格入口
- 6 个校园点位、1 条经典毕业路线
- Leaflet + 高德地图瓦片、点位卡片联动和路线播放
- 拍摄企划表单、规则匹配、配色/穿搭/Shot List 输出
- 企划结果通过点位 ID 传给地图，避免编造地点
- 手机端地图底部信息卡
- 纯静态 Netlify 部署

当前企划由本地确定性规则生成，保证比赛演示不依赖外部 API。`lib/planner/prompts.ts` 保留了后续 DeepSeek 服务端接入所需的 Prompt，但浏览器不会携带模型密钥。

## 数据流

```text
用户填写 /planner
  → inferStyle 推断或读取风格
  → retrieveCandidates 对真实点位评分
  → buildShootingPlan 生成结构化企划
  → /map?spots=... 传递合法点位 ID
  → Leaflet 渲染临时路线
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

构建结果输出到 `out/`，该目录是可再生成的产物，不上传 GitHub。

## 文件与代码的意义

### 页面 `app/`

| 文件 | 意义 |
| --- | --- |
| `app/layout.tsx` | 全站根布局、页面标题和全局样式入口。 |
| `app/globals.css` | Tailwind、Leaflet 样式、地图标记、路线和移动端抽屉样式。 |
| `app/page.tsx` | 首页；介绍产品，并把用户引向企划生成器或经典地图。 |
| `app/planner/page.tsx` | 企划表单；收集条件、调用本地规划模块并展示结果。 |
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
| `lib/planner/retrieveCandidates.ts` | 真实点位检索护栏；按风格、时间、室内需求、步行距离评分。 |
| `lib/planner/buildPlan.ts` | 把候选点位组织成配色、穿搭、动作和注意事项。 |
| `lib/planner/prompts.ts` | 后续接入 DeepSeek 时使用的 System Prompt 与 User Prompt 模板。当前不调用网络。 |
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
| `next.config.mjs` | Next.js 配置；当前为纯静态导出。 |
| `netlify.toml` | Netlify 构建命令和发布目录。 |
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

## 后续接入 DeepSeek

由于当前使用 `output: "export"`，Next.js API Route 不会随静态网站运行。真正调用模型时应二选一：

1. 新增 Netlify Function；或
2. 取消纯静态导出，部署到支持 Next.js 服务端函数的平台。

服务端流程应为：读取表单 → 检索候选点位 → 调用模型 → 校验 `selectedSpotIds` → 失败时返回当前规则规划。真实密钥只能配置在部署平台后台，不能写入仓库或浏览器代码。
