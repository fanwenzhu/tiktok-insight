import os
import sys
import base64
import subprocess
import json
import time
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DASHSCOPE_API_KEY = os.environ.get('DASHSCOPE_API_KEY')
DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
TEMP_DIR = '/tmp/tiktok-insight'
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(f'{TEMP_DIR}/uploads', exist_ok=True)
os.makedirs(f'{TEMP_DIR}/frames', exist_ok=True)


def get_video_duration(video_path):
    """获取视频时长（秒）"""
    try:
        cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'json', video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
        data = json.loads(result.stdout)
        return float(data['format']['duration'])
    except:
        return 60  # 默认60秒


def extract_frames(video_path, video_id, num_frames=8):
    """从视频中均匀抽取帧"""
    frames = []
    duration = get_video_duration(video_path)
    interval = duration / (num_frames + 1)

    frames_dir = f'{TEMP_DIR}/frames/{video_id}'
    os.makedirs(frames_dir, exist_ok=True)

    for i in range(num_frames):
        timestamp = interval * (i + 1)
        frame_path = f'{frames_dir}/frame_{i:02d}.jpg'
        cmd = [
            'ffmpeg', '-y', '-ss', str(timestamp),
            '-i', video_path,
            '-vframes', '1',
            '-q:v', '2',
            '-vf', 'scale=1024:-1',
            frame_path
        ]
        subprocess.run(cmd, capture_output=True, timeout=30)
        if os.path.exists(frame_path):
            with open(frame_path, 'rb') as f:
                b64 = base64.b64encode(f.read()).decode()
                frames.append({
                    'index': i,
                    'timestamp': round(timestamp, 1),
                    'data': f'data:image/jpeg;base64,{b64}'
                })
    return frames


def analyze_frame_with_qwen(frame_data, frame_index, timestamp):
    """调用 qwen-vl-plus 分析单帧"""
    payload = {
        'model': 'qwen-vl-plus',
        'input': {
            'messages': [
                {
                    'role': 'user',
                    'content': [
                        {
                            'text': f'''你是一个专业的TikTok/短视频内容分析师。请仔细分析这个视频的第 {frame_index+1} 个片段（{timestamp}秒处）。

请用JSON格式返回分析结果，包含以下字段：
- scene: 场景描述（10字以内）
- content_type: 内容类型（如：口播/展示/剧情/混剪等）
- key_moment: 是否为关键节点（yes/no）
- hook_type: 开头钩子类型（如：悬念/冲突/反常识/情绪等，没有则填"无"）
- visual_elements: 视觉元素（如：特写/远景/文字/特效等）
- text_overlay: 是否有字幕/文字（yes/no）
- emotion: 情绪基调（正向/负向/中性/冲突）
- talking_points: 口头表达的核心信息（20字以内）

只返回JSON，不要其他文字。'''
                        },
                        {'image': frame_data}
                    ]
                }
            ]
        }
    }

    import urllib.request
    req = urllib.request.Request(
        DASHSCOPE_URL,
        data=json.dumps(payload).encode(),
        headers={
            'Authorization': f'Bearer {DASHSCOPE_API_KEY}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode())
            if 'output' in result and 'choices' in result['output']:
                content = result['output']['choices'][0]['message']['content']
                # 尝试解析JSON
                if isinstance(content, str):
                    content = content.strip()
                    if content.startswith('```json'):
                        content = content[7:]
                    if content.startswith('```'):
                        content = content[3:]
                    if content.endswith('```'):
                        content = content[:-3]
                    try:
                        return json.loads(content.strip())
                    except:
                        return {'raw': content}
            return result
    except Exception as e:
        return {'error': str(e)}


def generate_prompt_from_analysis(frames_analysis):
    """根据帧分析结果生成逆向提示词"""
    if not frames_analysis:
        return "A short-form video content, engaging storytelling, dynamic editing"

    # 提取关键元素
    scenes = [f.get('scene', '') for f in frames_analysis if f.get('scene')]
    hook_types = list(set([f.get('hook_type', '') for f in frames_analysis if f.get('hook_type') and f.get('hook_type') != '无']))
    emotions = list(set([f.get('emotion', '') for f in frames_analysis if f.get('emotion')]))
    has_text = any(f.get('text_overlay') == 'yes' for f in frames_analysis)
    content_types = list(set([f.get('content_type', '') for f in frames_analysis if f.get('content_type')]))

    prompt_parts = []

    if content_types:
        prompt_parts.append(f"Content style: {', '.join(content_types)}")
    if hook_types:
        prompt_parts.append(f"Hook technique: {', '.join(hook_types)}")
    if emotions:
        prompt_parts.append(f"Emotional tone: {', '.join(emotions)}")

    prompt_parts.append("Cinematic vertical video format (9:16)")
    prompt_parts.append("Fast-paced editing with high engagement")
    if has_text:
        prompt_parts.append("Text overlays with key highlights")
    prompt_parts.append("Professional lighting and clear audio")
    prompt_parts.append("Call-to-action at the end to boost engagement")

    return "; ".join(prompt_parts)


def extract_insights(frames_analysis):
    """从帧分析结果中提炼玩法洞察"""
    if not frames_analysis:
        return None

    key_moments = [f for f in frames_analysis if f.get('key_moment') == 'yes']
    hook_types = [f.get('hook_type', '') for f in frames_analysis if f.get('hook_type') and f.get('hook_type') != '无']
    emotions = [f.get('emotion', '') for f in frames_analysis]
    texts = [f for f in frames_analysis if f.get('text_overlay') == 'yes']

    return {
        'opening': ', '.join(hook_types[:3]) if hook_types else '强视觉冲击开场',
        'music': '节奏感强，与内容情绪同步（建议用热门BGM）',
        'caption': '大字字幕 + 关键词高亮' if texts else '无明显字幕',
        'emotion': ', '.join(list(set(emotions))[:3]) if emotions else '正向情绪主导',
        'rhythm': f'共 {len(key_moments)} 个关键节点，节奏紧凑'
    }


def extract_remix_suggestions(frames_analysis, prompt):
    """生成复刻建议"""
    return [
        '保留原视频的开场钩子形式，更换内容主题',
        f'参考提示词结构：{prompt[:80]}...，应用到自己的垂直领域',
        '使用相同的节奏模板和字幕风格，重新创作',
        '在开头3秒加入更强的视觉冲击或悬念',
    ]


@app.route('/api/upload', methods=['POST'])
def upload():
    """接收视频文件或URL，返回 video_id"""
    video_id = str(uuid.uuid4())[:8]
    upload_dir = f'{TEMP_DIR}/uploads'
    os.makedirs(upload_dir, exist_ok=True)

    # 判断是 URL 还是文件
    if request.content_type and 'application/json' in request.content_type:
        data = request.get_json()
        url = data.get('url', '')
        if url:
            output_path = f'{TEMP_DIR}/downloads/{video_id}.mp4'
            os.makedirs(f'{TEMP_DIR}/downloads', exist_ok=True)
            try:
                exec_sync(
                    f'yt-dlp -f "mp4" --no-playlist -o "{output_path}" "{url}"',
                    capture_output=True, timeout=120
                )
                # 复制到 uploads 目录
                import shutil
                shutil.copy(output_path, f'{upload_dir}/{video_id}.mp4')
                return jsonify({'video_id': video_id, 'source': 'url', 'status': 'ready'})
            except Exception as e:
                return jsonify({'error': f'Download failed: {e}'}), 500
    else:
        # 文件上传
        video_file = request.files.get('video')
        if not video_file:
            return jsonify({'error': 'No video file'}), 400
        video_file.save(f'{upload_dir}/{video_id}.mp4')
        return jsonify({'video_id': video_id, 'source': 'file', 'status': 'ready'})


@app.route('/api/analyze/<video_id>', methods=['POST'])
def analyze_by_id(video_id):
    """分析指定 video_id 的视频"""
    video_path = f'{TEMP_DIR}/uploads/{video_id}.mp4'
    if not os.path.exists(video_path):
        return jsonify({'error': 'Video not found'}), 404

    duration = get_video_duration(video_path)
    num_frames = min(8, max(4, int(duration / 6)))
    frames = extract_frames(video_path, video_id, num_frames)

    if not frames:
        return jsonify({'error': 'Failed to extract frames'}), 500

    frames_analysis = []
    for i, frame in enumerate(frames):
        analysis = analyze_frame_with_qwen(frame['data'], i, frame['timestamp'])
        frames_analysis.append({'index': i, 'timestamp': frame['timestamp'], 'analysis': analysis})

    raw_analyses = [f['analysis'] for f in frames_analysis]
    prompt = generate_prompt_from_analysis(raw_analyses)
    insights = extract_insights(raw_analyses)
    remix = extract_remix_suggestions(raw_analyses, prompt)

    segments = []
    for f in frames_analysis:
        a = f['analysis']
        segments.append({
            'start': f['timestamp'] - 3,
            'end': f['timestamp'] + 3,
            'title': a.get('scene', f"片段 {f['index']+1}"),
            'desc': a.get('talking_points', a.get('content_type', '')),
            'emotion': a.get('emotion', ''),
            'visual': a.get('visual_elements', ''),
        })

    result = {
        'video_id': video_id,
        'duration': round(duration, 1),
        'frames_analyzed': len(frames),
        'prompt': prompt,
        'segments': segments,
        'insights': insights or {},
        'remix': remix,
    }
    return jsonify(result)



def analyze():
    """分析视频主入口"""
    # 处理上传的文件
    if 'video' not in request.files and request.content_type != 'multipart/form-data':
        return jsonify({'error': 'No video file provided'}), 400

    video_file = request.files.get('video')
    if not video_file:
        return jsonify({'error': 'No video file'}), 400

    video_id = str(uuid.uuid4())[:8]
    video_path = f'{TEMP_DIR}/uploads/{video_id}.mp4'
    video_file.save(video_path)

    # 获取视频信息
    duration = get_video_duration(video_path)
    num_frames = min(8, max(4, int(duration / 6)))  # 每6秒一帧

    # 抽帧
    frames = extract_frames(video_path, video_id, num_frames)

    if not frames:
        return jsonify({'error': 'Failed to extract frames'}), 500

    # 逐帧分析
    frames_analysis = []
    for i, frame in enumerate(frames):
        # 进度通知（通过结果携带）
        analysis = analyze_frame_with_qwen(frame['data'], i, frame['timestamp'])
        frame_info = {
            'index': i,
            'timestamp': frame['timestamp'],
            'analysis': analysis
        }
        frames_analysis.append(frame_info)

    # 生成综合结果
    raw_analyses = [f['analysis'] for f in frames_analysis]
    prompt = generate_prompt_from_analysis(raw_analyses)
    insights = extract_insights(raw_analyses)
    remix = extract_remix_suggestions(raw_analyses, prompt)

    # 构建分段结果
    segments = []
    for f in frames_analysis:
        a = f['analysis']
        segments.append({
            'start': f['timestamp'] - 3,
            'end': f['timestamp'] + 3,
            'title': a.get('scene', f"片段 {f['index']+1}"),
            'desc': a.get('talking_points', a.get('content_type', '')),
            'emotion': a.get('emotion', ''),
            'visual': a.get('visual_elements', ''),
        })

    result = {
        'video_id': video_id,
        'duration': round(duration, 1),
        'frames_analyzed': len(frames),
        'prompt': prompt,
        'segments': segments,
        'insights': insights or {},
        'remix': remix,
    }

    return jsonify(result)


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
