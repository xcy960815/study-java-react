# Study Java React

一个基于 `React 19 + TypeScript + Vite 7 + Ant Design 6 + Zustand` 的后台管理前端项目，包含登录注册、系统管理、监控、订单和商品管理等典型业务模块。

## 项目特点

- 登录、注册页采用更完整的品牌化双栏设计
- 基于路由配置自动生成侧边菜单
- 已补齐登录守卫、Token 失效跳转与刷新 Token 清理
- 支持 `daily / pre / prod` 三套环境
- 提供 Docker 构建与 Nginx 部署配置
- 已接入 Husky、lint-staged、GitHub Actions 质量检查

## 技术栈

- `React 19`
- `TypeScript 5`
- `Vite 7`
- `Ant Design 6`
- `Zustand`
- `Axios`
- `Tailwind CSS 4`

## 环境要求

- `Node.js 22+`
- `pnpm 10.33.0`

建议使用：

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
```

## 本地启动

安装依赖：

```bash
pnpm install
```

日常开发环境：

```bash
pnpm dev
```

预发环境：

```bash
pnpm dev:pre
```

生产环境配置联调：

```bash
pnpm dev:prod
```

## 构建与检查

类型检查：

```bash
pnpm typecheck
```

本地 lint：

```bash
pnpm lint
```

CI 严格检查：

```bash
pnpm lint:ci
```

生产构建：

```bash
pnpm build:prod
```

一键检查：

```bash
pnpm check
```

## 环境文件

环境变量位于 `env/` 目录：

- `env/.env.daily`
- `env/.env.pre`
- `env/.env.prod`

公共变量示例：

```env
VITE_APP_TITLE=Study Java React
VITE_API_DOMAIN_PREFIX=/api
```

## 路由与鉴权

- 未登录访问业务页会自动跳转到 `/login`
- 已登录访问 `/login` 或 `/register` 会自动回到系统首页
- Access Token 失效时会尝试刷新
- 刷新失败后会清理本地登录态并回到登录页

## 目录结构

```text
src
├─ apis            接口模块
├─ assets          静态资源
├─ components      通用组件
├─ enums           枚举
├─ hooks           自定义 hooks
├─ layout          主布局
├─ plugins         Vite/项目插件
├─ router          路由与鉴权
├─ store           Zustand 状态管理
├─ utils           工具函数
└─ views           业务页面
```

## 已有页面

- 登录 / 注册
- 系统管理
  - 用户管理
  - 角色管理
  - 菜单管理
  - 数据字典
- 监控管理
  - 操作日志
  - 服务监控
  - 经营报表
- 订单管理
- 商品管理

## Docker 部署

构建镜像：

```bash
docker build -t study-java-react .
```

运行容器：

```bash
docker run -p 8080:80 study-java-react
```

项目已提供：

- `Dockerfile`
- `nginx.conf`
- `.github/workflows/docker-build.yml`

## 开发约定

- 提交前会自动执行 `lint-staged`
- GitHub Actions 会在 `push` / `pull_request` 时执行 `lint + build`
- `public/file-structure.json` 为构建时生成文件，已加入 `.gitignore`

## 说明

- 当前仓库主要是前端项目，不包含完整后端服务
- `Ollama` / `DeepSeek` 入口暂未开放，在接入真实业务前默认隐藏
