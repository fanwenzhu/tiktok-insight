'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

type AnalysisResult = {
  video_id: string
  duration: number
  filename?: string
  segments: { start: number; end: number; title: string; desc: string; emotion?: string; visual?: string }[]
  prompt: string
  insights: { opening: string; music: string; caption: string; emotion: string; rhythm: string }
  remix: string[]
}

function AnalyzeContent() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get('id') || ''
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!videoId) return
    const stored = sessionStorage.getItem(`analysis_${videoId}`)
    if (stored) {
      try { setResult(JSON.parse(stored)) } catch {}
    }
  }, [videoId])

  const copyPrompt = () => {
    if (result?.prompt) {
      navigator.clipboard.writeText(result.prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!result) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😕</div>
      <h2 className="text-2xl font-bold text-white mb-2">未找到分析结果</h2>
      <p className="text-gray-400 mb-6">请先上传视频进行分析</p>
      <a href="/" className="bg-indigo-500 text-white px-6 py-2 rounded-full">返回首页</a>
    </div>
  )

  return (
    <>
      <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">📹 分析完成</h2>
        <div className="flex items-center gap-4">
          <div className="w-20 h-28 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-2xl border border-indigo-500/20 flex-shrink-0">▶</div>
          <div>
            <p className="text-white font-medium">{result.filename || `视频 ${videoId}`}</p>
            <p className="text-gray-400 text-sm">时长 {result.duration} 秒</p>
            <p className="text-gray-500 text-xs">共分析了 {result.segments?.length || 0} 个片段</p>
          </div>
        </div>
      </div>

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

      <div className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">💡 逆向提示词</h2>
          <button onClick={copyPrompt} className="text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full hover:bg-indigo-500/30 transition">
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
        <div className="bg-[#0f0f1a] rounded-lg p-4 border border-white/5">
          <p className="text-gray-300 text-sm font-mono leading-relaxed whitespace-pre-wrap">{result.prompt}</p>
        </div>
      </div>

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
    </>
  )
}

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="text-xl font-bold text-white">🎬 TikTokVideo Insight</div>
        <a href="/" className="text-gray-400 hover:text-white transition text-sm">← 返回首页</a>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Suspense fallback={
          <div className="text-center py-20">
            <div className="text-5xl mb-4 animate-pulse">🔍</div>
            <h2 className="text-2xl font-bold text-white">加载中...</h2>
          </div>
        }>
          <AnalyzeContent />
        </Suspense>

        <div className="text-center pt-4 pb-8">
          <a href="/" className="text-gray-500 hover:text-white transition text-sm">分析新视频 →</a>
        </div>
      </div>
    </div>
  )
}
