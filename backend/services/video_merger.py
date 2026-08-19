import re
from pathlib import Path
from moviepy import VideoFileClip, concatenate_videoclips

VIDEO_EXTENSIONS = {
    ".mp4",
    ".mov",
    ".avi",
    ".mkv",
    ".webm",
}


def natural_sort_key(path):
    return [
        int(part) if part.isdigit() else part.lower()
        for part in re.split(r"(\d+)", path.name)
    ]


def merge_video_paths(video_paths: list, output_file: Path):
    """
    Combina uma lista de caminhos de arquivos de vídeo em um único arquivo de saída.
    """
    output_file.parent.mkdir(parents=True, exist_ok=True)
    clips = []

    try:
        for video_path in video_paths:
            clips.append(VideoFileClip(str(video_path)))

        final_clip = concatenate_videoclips(
            clips,
            method="compose"
        )

        final_clip.write_videofile(
            str(output_file),
            codec="libx264",
            audio_codec="aac"
        )

        final_clip.close()

    finally:
        for clip in clips:
            try:
                clip.close()
            except Exception:
                pass


def merge_videos_from_dir(input_dir: Path, output_file: Path):
    """
    Busca vídeos em um diretório, ordena de forma natural e os junta.
    """
    videos = [
        path
        for path in input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in VIDEO_EXTENSIONS
    ]

    videos.sort(key=natural_sort_key)

    if not videos:
        raise RuntimeError(f"Nenhum vídeo encontrado em: {input_dir}")

    merge_video_paths(videos, output_file)
