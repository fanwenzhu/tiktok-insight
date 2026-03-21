import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('video') as File | null
    if (!file) return NextResponse.json({ error: 'No video file' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'mp4'
    const videoId = randomUUID().slice(0, 8)
    const filename = `${videoId}.${ext}`

    const uploadDir = '/tmp/tiktok-insight/uploads'
    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), buffer)

    return NextResponse.json({ video_id: videoId, filename })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
