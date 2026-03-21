import { NextRequest, NextResponse } from 'next/server'

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'https://cab-twelve-capacity-electrical.trycloudflare.com'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // URL 方式：抖音/TikTok 链接
      const { url } = await req.json()
      if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

      const res = await fetch(`${PYTHON_BACKEND}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(300000),
      })
      const data = await res.json()
      return NextResponse.json(data)
    } else {
      // 文件上传方式
      const formData = await req.formData()
      const file = formData.get('video') as File | null
      if (!file) return NextResponse.json({ error: 'No video file' }, { status: 400 })

      // 转发到 Python 后端（包含上传+分析）
      const backendFormData = new FormData()
      backendFormData.append('video', file)

      const res = await fetch(`${PYTHON_BACKEND}/api/analyze`, {
        method: 'POST',
        body: backendFormData,
        signal: AbortSignal.timeout(300000),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err }, { status: 502 })
      }

      const analysis = await res.json()
      return NextResponse.json({
        video_id: analysis.video_id,
        source: 'upload',
        analysis,
      })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
