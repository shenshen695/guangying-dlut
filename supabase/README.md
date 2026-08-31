# 光影大工 Supabase 后端说明

本目录只放数据库和权限脚本，不包含任何密钥。

## 需要手动创建的 Supabase 配置

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 在 Authentication 中确认邮箱注册/登录策略。演示阶段可以关闭邮箱确认，方便评委现场测试。
4. Storage bucket `gy-submissions` 会由 SQL 自动创建为 public bucket。后续如果要做私有审核流，可以改为 private bucket 并通过签名 URL 展示。
5. 在 `profiles` 表里只手动把管理员账号的 `role` 改为 `admin`。摄影师不要手动注册为管理员，先走 `/photographer/apply` 认证，管理员审核通过后系统会把 `role` 从 `photographer_pending` 改为 `photographer`。

## Netlify 环境变量

在 Netlify 项目后台配置：

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

不要配置或暴露 Supabase `service_role` key。

## 当前前端接入范围

- `/login`：邮箱注册、邮箱密码登录、退出登录、显示当前角色；注册时只能选择普通用户、申请成为摄影师或摄影社成员，不能选择管理员。
- `/photographer/apply`：提交摄影师认证资料，代表作品最多 3 张，状态进入 `pending`，账号角色进入 `photographer_pending`。
- `/contribute`：提交新机位，真实模式写入 `spot_submissions`，图片上传到 `gy-submissions/spot-submissions/{user_id}/...`。
- `/works/submit`：上传作品，真实模式写入 `work_submissions`，图片上传到 `gy-submissions/work-submissions/{user_id}/...`；必须选择点位、季节、风格，上传图片并确认授权。
- `/admin/submissions`：管理员查看摄影师申请、点位投稿、作品投稿，修改状态并写入 `review_logs`；通过摄影师申请后同步更新 `profiles.role = photographer`。
- `/photographer/dashboard`：只有已审核通过的摄影师和管理员可进入。`photographer_pending` 只能看到认证审核中提示，不会公开展示主页。

## 演示模式

如果没有配置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，页面不会崩溃，会显示“当前为演示模式，后端未连接”，并使用本地演示数据完成提交和审核状态展示。
