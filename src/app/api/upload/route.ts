import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { execSync } from 'child_process'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // URL 方式
      const { url } = await req.json()
      if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

      const videoId = randomUUID().slice(0, 8)
      const downloadDir = '/tmp/tiktok-insight/downloads'
      const uploadDir = '/tmp/tiktok-insight/uploads'
      const outputPath = path.join(downloadDir, `${videoId}.mp4`)

      await mkdir(downloadDir, { recursive: true })
      await mkdir(uploadDir, { recursive: true })

      try {
        // 用 yt-dlp 下载视频
        execSync(
          `yt-dlp -f "mp4" --no-playlist -o "${outputPath}" "${url}"`,
          { stdio: 'pipe', timeout: 120 }
        )
        // 读取下载的文件并保存到 uploads 目录
        const { readFileSync } = require('fs')
        const buffer = readFileSync(outputPath)
        await writeFile(path.join(uploadDir, `${videoId}.mp4`), buffer)

        return NextResponse.json({
          video_id: videoId,
          filename: `${videoId}.mp4`,
          source: 'url',
          url,
        })
      } catch (downloadError: any) {
        return NextResponse.json({
          video_id: videoId,
          url,
          status: 'download_failed',
          error: downloadError.message,
        })
      }
    } else {
      // 文件上传方式
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

      return NextResponse.json({ video_id: videoId, filename, source: 'upload' })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
