'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type AnalysisResult = {
  video_id: string
  duration: number
  filename?: string
  segments: { start: number; end: number; title: string; desc: string; emotion?: string; visual?: string }[]
  prompt: string
  insights: { opening: string; music: string; caption: string; emotion: string; rhythm: string }
  remix: string[]
}

export default function AnalyzePage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!videoId) return

    // 优先从 sessionStorage 读取（上传时已存储）
    const stored = sessionStorage.getItem(`analysis_${videoId}`)
    if (stored) {
      try {
        setResult(JSON.parse(stored))
        setLoading(false)
        return
      } catch {}
    }

    // fallback：尝试从 API 读取
    fetch(`/api/result/${videoId}`)
      .then(r => r.json())
      .then(data => {
        if (data.analysis) setResult(data.analysis)
        else setResult(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [videoId])

  const copyPrompt = () => {
    if (result?.prompt) {
      navigator.clipboard.writeText(result.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6 animate-pulse">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">AI 分析中...</h2>
          <p className="text-gray-400">正在拆解视频，请稍候</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-6">😕</div>
          <h2 className="text-2xl font-bold text-white mb-2">未找到分析结果</h2>
          <p className="text-gray-400 mb-6">请先上传视频进行分析</p>
          <button onClick={() => router.push('/')} className="bg-indigo-500 text-white px-6 py-2 rounded-full">
            返回首页
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="text-xl font-bold text-white">🎬 TikTokVideo Insight</div>
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white transition text-sm">
          ← 返回首页
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Video Info */}
        <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4">📹 分析完成</h2>
          <div className="flex items-center gap-4">
            <div className="w-20 h-28 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-2xl border border-indigo-500/20 flex-shrink-0">
              ▶
            </div>
            <div>
              <p className="text-white font-medium">{result.filename || `视频 ${videoId}`}</p>
              <p className="text-gray-400 text-sm">时长 {result.duration} 秒</p>
              <p className="text-gray-500 text-xs">共分析了 {result.segments?.length || 0} 个片段</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {result.segments && result.segments.length > 0 && (
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4">⏱ 视频时间线</h2>
            <div className="space-y-3">
              {result.segments.map((seg, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="bg-indigo-500/20 text-indigo-400 text-xs font-mono px-2 py-1 rounded flex-shrink-0 mt-0.5">
                    {Math.floor(seg.start)}s-{Math.floor(seg.end)}s
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{seg.title}</p>
                    <p className="text-gray-400 text-xs">{seg.desc}</p>
                    {seg.emotion && <p className="text-gray-500 text-xs mt-1">情绪：{seg.emotion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            <p className="text-gray-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              {result.prompt}
            </p>
          </div>
        </div>

        {/* Insights */}
        {result.insights && (
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4">📊 玩法提炼</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: '开场', icon: '🎬', value: result.insights.opening },
                { label: '音乐', icon: '🎵', value: result.insights.music },
                { label: '字幕', icon: '💬', value: result.insights.caption },
                { label: '情绪', icon: '❤️', value: result.insights.emotion },
                { label: '节奏', icon: '⚡', value: result.insights.rhythm },
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
        )}

        {/* Remix */}
        {result.remix && (
          <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
            <h2 className="text-lg font-semibold text-white mb-4">🔄 复刻建议</h2>
            <ul className="space-y-3">
              {result.remix.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-indigo-400 flex-shrink-0 mt-0.5">→</span>
                  <p className="text-gray-300 text-sm">{tip}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center pt-4 pb-8">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-white transition text-sm">
            分析新视频 →
          </button>
        </div>
      </div>
    </div>
  )
}
