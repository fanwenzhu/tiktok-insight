import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // URL 方式
      const { url } = await req.json()
      if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

      const videoId = randomUUID().slice(0, 8)

      // 检查是否有 yt-dlp
      try {
        const { execSync } = require('child_process')
        execSync('which yt-dlp', { stdio: 'pipe' })
      } catch {
        // yt-dlp 不存在，先尝试安装
        return NextResponse.json({ video_id: videoId, url, status: 'url_mode' })
      }

      // 下载视频
      const downloadDir = '/tmp/tiktok-insight/downloads'
      await mkdir(downloadDir, { recursive: true })
      const outputPath = path.join(downloadDir, `${videoId}.mp4`)

      try {
        const { execSync } = require('child_process')
        execSync(
          `yt-dlp -f "mp4" -o "${outputPath}" "${url}"`,
          { stdio: 'pipe', timeout: 60000 }
        )
        const buffer = require('fs').readFileSync(outputPath)
        const uploadDir = '/tmp/tiktok-insight/uploads'
        await mkdir(uploadDir, { recursive: true })
        await writeFile(path.join(uploadDir, `${videoId}.mp4`), buffer)
        return NextResponse.json({ video_id: videoId, filename: `${videoId}.mp4`, source: 'url' })
      } catch (e) {
        return NextResponse.json({ video_id: videoId, url, status: 'download_failed' })
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
