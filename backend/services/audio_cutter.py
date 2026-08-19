import csv
import subprocess
from pathlib import Path
from yt_dlp import YoutubeDL


def time_to_seconds(t: str) -> int:
    if isinstance(t, (int, float)):
        return int(t)
    
    # Split time format e.g. "01:23" or "00:01:23"
    partes = list(map(int, t.split(":")))
    if len(partes) == 2:
        m, s = partes
        return m * 60 + s
    elif len(partes) == 3:
        h, m, s = partes
        return h * 3600 + m * 60 + s
    return int(t)


def convert_mp4_to_mp3(input_file: Path, output_file: Path):
    output_file.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",
        "-i", str(input_file),
        "-vn",
        "-acodec", "libmp3lame",
        "-ab", "192k",
        str(output_file),
    ]

    subprocess.run(cmd, check=True)


def download_from_youtube(url: str, output_mp3: Path):
    output_mp3.parent.mkdir(parents=True, exist_ok=True)
    temp_template = output_mp3.with_suffix(".%(ext)s")

    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": str(temp_template),
        "nocheckcertificate": True,
    }

    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        temp_file = Path(ydl.prepare_filename(info))

    # Convert the downloaded temp audio file to mp3
    try:
        subprocess.run([
            "ffmpeg", "-y",
            "-i", str(temp_file),
            "-vn",
            "-acodec", "libmp3lame",
            "-ab", "192k",
            str(output_mp3)
        ], check=True)
    finally:
        # Clean up temp file only if it is different from output_mp3
        if temp_file.resolve() != output_mp3.resolve() and temp_file.exists():
            temp_file.unlink(missing_ok=True)


def cut_audio(audio_path: Path, chapters: list, output_dir: Path):
    """
    Corta o arquivo de áudio em múltiplos arquivos baseados na lista de capítulos.
    Cada capítulo deve ser um dicionário contendo:
      - 'name': Nome do arquivo de saída (sem extensão)
      - 'start': Tempo de início (str "MM:SS", "HH:MM:SS" ou int/float segundos)
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Converter todos os tempos de início para segundos e ordenar
    processed_chapters = []
    for chap in chapters:
        processed_chapters.append({
            "name": chap["name"],
            "start": time_to_seconds(chap["start"])
        })
    
    processed_chapters.sort(key=lambda x: x["start"])

    created_files = []

    for i, chapter in enumerate(processed_chapters):
        start = chapter["start"]
        end = processed_chapters[i + 1]["start"] if i + 1 < len(processed_chapters) else None

        output_file = output_dir / f"{chapter['name']}.mp3"

        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(audio_path),
            "-ss", str(start),
        ]

        if end:
            cmd += ["-to", str(end)]

        cmd += ["-c", "copy", str(output_file)]

        subprocess.run(cmd, check=True)
        created_files.append(output_file)

    return created_files
