'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'

type InputMode = 'upload' | 'url'

const BACKEND = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'https://cab-twelve-capacity-electrical.trycloudflare.com'

export default function Home() {
  const [mode, setMode] = useState<InputMode>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState('')
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
    setProgress(10)

    const formData = new FormData()
    formData.append('video', file)

    try {
      // Step 1: 上传视频
      setProgress(30)
      const uploadRes = await fetch(`${BACKEND}/api/upload`, { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()

      if (uploadData.error) {
        alert('上传失败：' + uploadData.error)
        setUploading(false)
        return
      }

      const videoId = uploadData.video_id
      setProgress(50)

      // Step 2: 分析视频
      const analyzeRes = await fetch(`${BACKEND}/api/analyze/${videoId}`, { method: 'POST' })
      const analyzeData = await analyzeRes.json()

      if (analyzeData.error) {
        alert('分析失败：' + analyzeData.error)
        setUploading(false)
        return
      }

      setProgress(90)
      sessionStorage.setItem(`analysis_${videoId}`, JSON.stringify(analyzeData))
      setProgress(100)
      window.location.href = `/analyze?id=${videoId}`
    } catch (e) {
      alert('请求失败：' + String(e))
      setUploading(false)
    }
  }, [])

  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url || (!url.includes('tiktok.com') && !url.includes('douyin.com'))) {
      alert('请输入正确的 TikTok 或抖音链接')
      return
    }

    setUploading(true)
    setProgress(10)

    try {
      setProgress(30)
      const uploadRes = await fetch(`${BACKEND}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const uploadData = await uploadRes.json()

      if (uploadData.error) {
        alert('下载失败：' + uploadData.error)
        setUploading(false)
        return
      }

      const videoId = uploadData.video_id
      setProgress(50)

      const analyzeRes = await fetch(`${BACKEND}/api/analyze/${videoId}`, { method: 'POST' })
      const analyzeData = await analyzeRes.json()

      if (analyzeData.error) {
        alert('分析失败：' + analyzeData.error)
        setUploading(false)
        return
      }

      setProgress(90)
      sessionStorage.setItem(`analysis_${videoId}`, JSON.stringify(analyzeData))
      setProgress(100)
      window.location.href = `/analyze?id=${videoId}`
    } catch (e) {
      alert('请求失败：' + String(e))
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
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="text-xl font-bold text-white">🎬 TikTokVideo Insight</div>
        <Link href="/history" className="text-gray-400 hover:text-white transition text-sm">历史记录</Link>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        <div className="inline-block bg-indigo-500/10 text-indigo-400 text-xs px-3 py-1 rounded-full mb-4 border border-indigo-500/20">
          AI 驱动 · 爆款解码
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          爆款视频拆解，<span className="text-indigo-400">AI 帮你做</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-12">
          上传视频 或 粘贴链接，AI 自动分析内容结构、<br />
          提取逆向提示词，一键复刻爆款
        </p>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setMode('upload')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${mode === 'upload' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            上传视频
          </button>
          <button
            onClick={() => setMode('url')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${mode === 'url' ? 'bg-indigo-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            粘贴链接
          </button>
        </div>

        {/* Upload Mode */}
        {mode === 'upload' && (
          <div
            className={`w-full max-w-lg border-2 border-dashed rounded-2xl p-12 transition cursor-pointer ${dragging ? 'border-indigo-400 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/40'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
            />
            <div className="text-5xl mb-4">{dragging ? '📥' : '📤'}</div>
            <p className="text-white font-medium mb-1">
              {dragging ? '释放以上传' : '拖拽视频到这里'}
            </p>
            <p className="text-gray-500 text-sm">或点击选择文件 · 最大 500MB（MP4）</p>
          </div>
        )}

        {/* URL Mode */}
        {mode === 'url' && (
          <div className="w-full max-w-lg">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="粘贴 TikTok 或抖音链接..."
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 text-sm"
                onKeyDown={e => { if (e.key === 'Enter') handleUrlSubmit(videoUrl) }}
              />
              <button
                onClick={() => handleUrlSubmit(videoUrl)}
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition text-sm"
              >
                解析
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-2 text-left">支持 tiktok.com 和 douyin.com 链接</p>
          </div>
        )}

        {uploading && (
          <div className="w-full max-w-lg mt-8">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{progress < 50 ? '上传中...' : progress < 90 ? 'AI 分析中...' : '完成！'}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1.5">
              <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🔍', title: '智能拆解', desc: 'AI 自动识别视频结构、场景切换、内容节奏' },
          { icon: '💡', title: '逆向提示词', desc: '还原爆款内容的 Prompt 提示词，可直接使用' },
          { icon: '🔄', title: '一键复刻', desc: '提取核心玩法，提供复刻建议和改版思路' },
        ].map((f, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/5">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-white font-semibold mb-1">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Contact */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-gray-600 text-sm">
          微信联系：<span className="text-indigo-400">tigerAI2</span>
        </p>
      </footer>
    </div>
  )
}
