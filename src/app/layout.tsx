import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TikTokVideo Insight - 爆款视频拆解平台',
  description: '上传爆款视频，AI 逆向拆解爆款基因，帮您复刻爆款',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  )
}
