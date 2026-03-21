import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

// 任务状态存储（生产环境请用 Redis）
const tasks = new Map<string, {
  status: 'pending' | 'processing' | 'done' | 'error'
  progress: number
  analysis?: any
  error?: string
  filePath?: string
}>()

const PYTHON_BACKEND = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001'
const UPLOAD_DIR = '/tmp/tiktok-insight/uploads'

export async function POST(req: NextRequest, { params }: { params: { video_id: string } }) {
  const { video_id } = params

  // 查找对应的视频文件
  let filePath: string | null = null
  for (const ext of ['mp4', 'avi', 'mov', 'mkv', 'webm']) {
    const p = path.join(UPLOAD_DIR, `${video_id}.${ext}`)
    if (existsSync(p)) { filePath = p; break }
  }

  if (!filePath) {
    return NextResponse.json({ error: 'Video file not found' }, { status: 404 })
  }

  tasks.set(video_id, { status: 'processing', progress: 10, filePath })

  // 异步分析
  ;(async () => {
    try {
      tasks.set(video_id, { status: 'processing', progress: 30, filePath })

      const buffer = readFileSync(filePath)
      const filename = path.basename(filePath)

      const analyzeFormData = new FormData()
      analyzeFormData.append('video', new Blob([buffer], { type: 'video/mp4' }), filename)

      tasks.set(video_id, { status: 'processing', progress: 60, filePath })

      const res = await fetch(`${PYTHON_BACKEND}/api/analyze`, {
        method: 'POST',
        body: analyzeFormData,
        signal: AbortSignal.timeout(180000),
      })

      tasks.set(video_id, { status: 'processing', progress: 90, filePath })

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Backend error ${res.status}: ${errText}`)
      }

      const analysis = await res.json()
      tasks.set(video_id, {
        status: 'done',
        progress: 100,
        analysis,
        filePath,
      })
    } catch (e: any) {
      tasks.set(video_id, {
        status: 'error',
        progress: 0,
        error: e.message,
      })
    }
  })()

  return NextResponse.json({ video_id, status: 'processing', progress: 10 })
}

export async function GET(req: NextRequest, { params }: { params: { video_id: string } }) {
  const task = tasks.get(params.video_id)
  if (!task) return NextResponse.json({ status: 'not_found' }, { status: 404 })
  return NextResponse.json(task)
}
