'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type AnalysisResult = {
  video_id: string
  filename: string
  duration: number
  segments: { start: number; end: number; title: string; desc: string }[]
  prompt: string
  insights: { opening: string; music: string; caption: string; emotion: string; rhythm: string }
  remix: string[]
}

type TaskState = {
  status: string
  progress: number
  result?: AnalysisResult
}

export default function AnalyzePage() {
  const params = useParams()
  const videoId = params.id as string
  const [task, setTask] = useState<TaskState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!videoId) return

    // 触发分析
    fetch(`/api/analyze/${videoId}`, { method: 'POST' })

    // 轮询状态
    const poll = setInterval(async () => {
      const res = await fetch(`/api/analyze/${videoId}`)
      const data: TaskState = await res.json()
      setTask(data)
      if (data.status === 'done') clearInterval(poll)
    }, 1000)

    return () => clearInterval(poll)
  }, [videoId])

  const copyPrompt = () => {
    if (task?.result?.prompt) {
      navigator.clipboard.writeText(task.result.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">🎬 TikTokVideo Insight</Link>
        <Link href="/history" className="text-gray-400 hover:text-white transition text-sm">历史记录</Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress or Result */}
        {task?.status !== 'done' ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="text-5xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-white mb-2">AI 分析中...</h2>
            <p className="text-gray-400 mb-8">正在深度拆解视频，请稍候</p>
            <div className="w-full max-w-md">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>分析进度</span>
                <span>{task?.progress ?? 0}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${task?.progress ?? 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-3">
                <span className={task?.progress && task.progress >= 10 ? 'text-indigo-400' : ''}>✓ 上传完成</span>
                <span className={task?.progress && task.progress >= 50 ? 'text-indigo-400' : ''}>✓ 切片分析</span>
                <span className={task?.progress && task.progress >= 90 ? 'text-indigo-400' : ''}>✓ AI 拆解</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Video Preview */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4">📹 视频信息</h2>
              <div className="flex items-center gap-4">
                <div className="w-24 h-36 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-3xl border border-indigo-500/20">
                  ▶
                </div>
                <div>
                  <p className="text-white font-medium">{task?.result?.filename}</p>
                  <p className="text-gray-400 text-sm">时长 {task?.result?.duration} 秒</p>
                  <p className="text-gray-500 text-xs mt-1">ID: {videoId}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4">⏱ 视频时间线</h2>
              <div className="space-y-3">
                {task?.result?.segments.map((seg, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="bg-indigo-500/20 text-indigo-400 text-xs font-mono px-2 py-1 rounded flex-shrink-0 mt-0.5">
                      {seg.start}s-{seg.end}s
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{seg.title}</p>
                      <p className="text-gray-400 text-xs">{seg.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">💡 逆向提示词</h2>
                <button
                  onClick={copyPrompt}
                  className="text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full hover:bg-indigo-500/30 transition"
                >
                  {copied ? '✓ 已复制' : '复制'}
                </button>
              </div>
              <div className="bg-[#0f0f1a] rounded-lg p-4 border border-white/5">
                <p className="text-gray-300 text-sm font-mono leading-relaxed">
                  {task?.result?.prompt}
                </p>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4">📊 玩法提炼</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: '开场', icon: '🎬', value: task?.result?.insights.opening },
                  { label: '音乐', icon: '🎵', value: task?.result?.insights.music },
                  { label: '字幕', icon: '💬', value: task?.result?.insights.caption },
                  { label: '情绪', icon: '❤️', value: task?.result?.insights.emotion },
                  { label: '节奏', icon: '⚡', value: task?.result?.insights.rhythm },
                ].map((item, i) => (
                  <div key={i} className="bg-[#0f0f1a] rounded-lg p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{item.icon}</span>
                      <span className="text-gray-400 text-sm">{item.label}</span>
                    </div>
                    <p className="text-white text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Remix */}
            <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold text-white mb-4">🔄 复刻建议</h2>
              <ul className="space-y-3">
                {task?.result?.remix.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-indigo-400 flex-shrink-0 mt-0.5">→</span>
                    <p className="text-gray-300 text-sm">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Back */}
            <div className="text-center pt-4">
              <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
                ← 返回首页
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
