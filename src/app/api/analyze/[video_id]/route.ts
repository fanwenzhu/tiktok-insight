import { NextRequest, NextResponse } from 'next/server'

const tasks = new Map<string, { status: string; progress: number; result?: any }>()

export async function GET(req: NextRequest, { params }: { params: { video_id: string } }) {
  const task = tasks.get(params.video_id)
  if (!task) return NextResponse.json({ status: 'not_found' }, { status: 404 })
  return NextResponse.json(task)
}

export async function POST(req: NextRequest, { params }: { params: { video_id: string } }) {
  const { video_id } = params
  tasks.set(video_id, { status: 'processing', progress: 0 })

  ;(async () => {
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 500))
      const task = tasks.get(video_id)
      if (task) task.progress = i
    }
    tasks.set(video_id, {
      status: 'done',
      progress: 100,
      result: {
        video_id,
        duration: 45,
        segments: [
          { start: 0, end: 10, title: '开场吸引', desc: '强视觉冲击开场，快速抓住注意力' },
          { start: 10, end: 25, title: '核心内容', desc: '情绪饱满，节奏紧凑' },
          { start: 25, end: 38, title: '高潮转折', desc: '冲突放大，引发共鸣' },
          { start: 38, end: 45, title: '引导互动', desc: '行动号召明确，提升互动率' },
        ],
        prompt: 'A confident person in a modern setting, dynamic camera movement, emotional storytelling, cinematic lighting, vertical video format, engaging narrative, call-to-action at the end',
        insights: {
          opening: '强视觉冲击 + 前3秒抛出悬念',
          music: '节奏感强，与内容情绪同步',
          caption: '大字字幕 + 关键词高亮',
          emotion: '正向情绪主导，引发共鸣',
          rhythm: '每5秒一个小高潮',
        },
        remix: [
          '换不同场景重现相同结构',
          '保留开头钩子，换内容主题',
          '将节奏模板应用到自己的垂直领域',
        ],
      }
    })
  })()

  return NextResponse.json({ video_id, status: 'processing' })
}
