# 个人作品集使用说明

周天的 AI 产品运营作品集。基于 Vite + React，保留原有图像画廊、关键词互动、背景网格与工牌。

## 本地预览

```powershell
npm.cmd run dev
```

打开终端显示的本地地址（默认 http://localhost:5173/）。使用 `npm.cmd run build` 生成 `dist/`，使用 `npm.cmd run preview` 检查构建结果。页面包含 React 模块，需要通过本地服务器预览。

## 当前结构

1. 姓名、头像与项目入口。
2. 精选项目：心屿 AI 陪伴产品、人力数据看板。
3. 内容运营与 AI 工作流。
4. 流程沉淀与工具探索。
5. 策划与视觉表达、个人介绍与联系方式。

两个新项目采用左图右文结构。心屿展示 5 张截图，人力数据看板展示 4 张截图；可点击缩略图、左右箭头或使用方向键切换，点击大图放大。角色经本人确认：主要独立完成，借助 AI 工具开发。

每轮修改做本地 Git 提交；只有本人明确要求上传 GitHub 时才推送远端。

项目截图放在 `assets/projects/`，使用 WebP 减少加载体积；`vite.config.js` 另保留稳定路径，供图片弹窗读取。新增页面样式集中在 `portfolio.css`。

截图与文案证据记录见 [项目内容说明](docs/portfolio-project-sources.md)。本机截图、隔离演示数据库及检查产物在 `output/`，已从 Git 排除。

## 修改文字

- 首页标题、介绍、联系方式：编辑 `index.html`
- 每个作品的标题、说明、标签：编辑 `index.html` 里对应的 `work-card`
- 目前页面已填入姓名“周天”、邮箱和微信；如需公开电话，建议上线前再决定。

## 修改图片

- 首页预览图放在 `assets/thumbs/`
- 点击后打开的完整长图放在 `assets/full/`
- HR 工作流程建设板块图片放在 `assets/full/招聘看板.png` 和 `assets/full/HR文档.png`
- 个人照片放在 `assets/profile/`
- 文件名目前是 `work-01.png` 到 `work-07.png`

如果要新增作品，复制一个 `work-card` 区块，并把图片路径改成对应文件名。
# personal-resume
