'use client'

import { useState } from 'react'
import Link from 'next/link'

type HistoryItem = {
  video_id: string
  filename: string
  analyzedAt: string
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tiktok_history')
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  const clearHistory = () => {
    localStorage.removeItem('tiktok_history')
    setItems([])
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold text-white">🎬 TikTokVideo Insight</Link>
        <Link href="/" className="text-gray-400 hover:text-white transition text-sm">← 返回首页</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">📋 分析历史</h1>
          {items.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-sm text-gray-500 hover:text-red-400 transition"
            >
              清空记录
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-32">
            <div className="text-5xl mb-4">📭</div>
            <p className="text-gray-400 mb-2">还没有分析记录</p>
            <p className="text-gray-600 text-sm">上传一个视频开始分析吧</p>
            <Link
              href="/"
              className="inline-block mt-6 bg-indigo-500 text-white px-6 py-2 rounded-full text-sm hover:bg-indigo-600 transition"
            >
              立即分析
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.video_id}
                href={`/analyze/${item.video_id}`}
                className="block bg-[#1a1a2e] rounded-xl p-4 border border-white/5 hover:border-indigo-500/30 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center text-lg border border-indigo-500/20">
                      ▶
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{item.filename}</p>
                      <p className="text-gray-500 text-xs">分析时间：{item.analyzedAt}</p>
                      <p className="text-gray-600 text-xs">ID：{item.video_id}</p>
                    </div>
                  </div>
                  <span className="text-indigo-400 text-sm">查看 →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
