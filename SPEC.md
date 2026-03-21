TikTokVideo Insight - 视频拆解平台产品规格说明书

## 1. 产品概述
- 产品名：TikTokVideo Insight（暂定）
- 一句话描述：上传爆款视频，AI 逆向拆解出爆款基因，帮用户复刻爆款

## 2. 核心功能
- F1: 视频上传（拖拽+点击，支持MP4，最大500MB）
- F2: AI 拆解（提取关键帧、分析内容结构、生成时间线）
- F3: 提示词逆向（根据视频内容反向生成可用于生成的提示词）
- F4: 分段分析（自动将视频分成3-5个片段，每个片段单独分析）
- F5: 玩法提炼（总结开场/音乐/字幕/情绪/节奏规律）
- F6: 复刻参考（给出变体创作建议）

## 3. 页面结构
- /: 首页（上传区 + 功能介绍 + 历史入口）
- /analyze/[id]: 分析结果页
- /history: 历史记录页

## 4. 技术方案
- 前端：Next.js 14 + Tailwind CSS + TypeScript
- 后端：Python Flask
- AI：qwen-vl-plus（通义千问）做视频帧分析
- 视频处理：FFmpeg（切片、抽帧）
- 存储：本地文件系统 + localStorage

## 5. API 设计
- POST /api/upload - 上传视频，返回 video_id
- POST /api/analyze/[video_id] - 触发分析任务
- GET /api/status/[video_id] - 查询分析状态
- GET /api/result/[video_id] - 获取分析结果