'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

export default function Home() {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('video/')) {
      alert('请上传视频文件（MP4）')
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      alert('文件最大 500MB')
      return
    }

    setUploading(true)
    setProgress(0)

    const formData = new FormData()
    formData.append('video', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      // 模拟进度
      let p = 0
      const interval = setInterval(() => {
        p += Math.random() * 15
        if (p >= 90) { clearInterval(interval); p = 90 }
        setProgress(Math.round(p))
      }, 500)

      // 触发分析
      await fetch(`/api/analyze/${data.video_id}`, { method: 'POST' })
      clearInterval(interval)
      setProgress(100)

      // 跳转
      window.location.href = `/analyze/${data.video_id}`
    } catch (e) {
      alert('上传失败：' + String(e))
      setUploading(false)
    }
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [handleUpload])

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="text-xl font-bold text-white">🎬 TikTokVideo Insight</div>
        <Link href="/history" className="text-gray-400 hover:text-white transition text-sm">
          历史记录
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="inline-block bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full mb-4 border border-indigo-500/20">
          AI 驱动 · 爆款解码
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          爆款视频拆解，<span className="text-indigo-400">AI 帮你做</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-12">
          上传任意 TikTok/抖音爆款视频，AI 自动分析内容结构、<br />
          逆向生成提示词、提炼玩法规律，助你批量复刻爆款
        </p>

        {/* Upload Zone */}
        <div
          className={`relative w-full max-w-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            dragging
              ? 'border-indigo-400 bg-indigo-500/10'
              : 'border-white/10 hover:border-indigo-500/40 hover:bg-white/5'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="text-4xl">⏳</div>
              <p className="text-white font-medium">上传分析中...</p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-indigo-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">{progress}%</p>
            </div>
          ) : (
            <>
              <div className="text-5xl mb-4">📤</div>
              <p className="text-white font-semibold text-lg mb-2">
                拖拽视频到这里，或点击上传
              </p>
              <p className="text-gray-500 text-sm">支持 MP4，最大 500MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-10">核心能力</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🧠', title: 'AI 智能拆解', desc: '自动提取关键帧，分析内容结构、节奏、情绪' },
            { icon: '💡', title: '提示词逆向', desc: '从爆款视频反向生成可用的 AI 提示词' },
            { icon: '📊', title: '玩法提炼', desc: '总结开场、音乐、字幕风格、节奏规律' },
            { icon: '✂️', title: '分片段分析', desc: '自动将视频分成 3-5 个片段，精细化拆解' },
            { icon: '🔄', title: '复刻参考', desc: '基于分析结果给出变体创作方向' },
            { icon: '📈', title: '批量沉淀', desc: '历史记录永久保存，构建自己的爆款素材库' },
          ].map((f, i) => (
            <div key={i} className="bg-[#1a1a2e] rounded-xl p-6 border border-white/5 hover:border-indigo-500/30 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-white font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-gray-600 text-sm py-8 border-t border-white/5">
        © 2026 TikTokVideo Insight · 用 AI 解码爆款
      </footer>
    </div>
  )
}
