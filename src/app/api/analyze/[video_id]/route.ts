import { NextRequest, NextResponse } from 'next/server'

const tasks = new Map<string, any>()
const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'https://cab-twelve-capacity-electrical.trycloudflare.com'

export async function POST(req: NextRequest, { params }: { params: { video_id: string } }) {
  const { video_id } = params

  // 查找视频文件（通过 URL 参数或查内存）
  // 实际通过 file_id 找文件
  tasks.set(video_id, { status: 'processing', progress: 10 })

  // 异步分析
  ;(async () => {
    try {
      tasks.set(video_id, { status: 'processing', progress: 30 })
      const res = await fetch(`${PYTHON_BACKEND}/api/analyze/${video_id}`, {
        method: 'POST',
        signal: AbortSignal.timeout(180000),
      })
      tasks.set(video_id, { status: 'processing', progress: 60 })
      if (!res.ok) throw new Error(`Backend error: ${res.status}`)
      const analysis = await res.json()
      tasks.set(video_id, { status: 'done', progress: 100, analysis })
    } catch (e: any) {
      tasks.set(video_id, { status: 'error', progress: 0, error: e.message })
    }
  })()

  return NextResponse.json({ video_id, status: 'processing', progress: 10 })
}

export async function GET(req: NextRequest, { params }: { params: { video_id: string } }) {
  const task = tasks.get(params.video_id)
  if (!task) return NextResponse.json({ status: 'not_found' }, { status: 404 })
  return NextResponse.json(task)
}
