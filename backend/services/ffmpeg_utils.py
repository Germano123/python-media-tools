import os
import shutil
import subprocess
from pathlib import Path

_CACHED_FFMPEG_EXE = None


def get_ffmpeg_exe() -> str:
    """
    Retorna o caminho absoluto para o executável do FFmpeg.
    Prioriza o binário portátil fornecido pela biblioteca `imageio-ffmpeg`,
    com fallback para o binário configurado no PATH do sistema.
    """
    global _CACHED_FFMPEG_EXE
    if _CACHED_FFMPEG_EXE and os.path.exists(_CACHED_FFMPEG_EXE):
        return _CACHED_FFMPEG_EXE

    # 1. Tenta obter pelo imageio_ffmpeg
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            _CACHED_FFMPEG_EXE = exe
            return exe
    except Exception:
        pass

    # 2. Fallback para ffmpeg no PATH do sistema operacional
    system_exe = shutil.which("ffmpeg")
    if system_exe:
        _CACHED_FFMPEG_EXE = system_exe
        return system_exe

    raise RuntimeError(
        "Executável do FFmpeg não encontrado. Certifique-se de que o pacote 'imageio-ffmpeg' "
        "está instalado ou que o 'ffmpeg' está no PATH do sistema operacional."
    )


def run_ffmpeg(args: list, check: bool = True, **kwargs) -> subprocess.CompletedProcess:
    """
    Executa um comando FFmpeg utilizando o binário unificado detectado.
    Garante mensagens de erro amigáveis em caso de falha.
    """
    ffmpeg_exe = get_ffmpeg_exe()
    cmd = [ffmpeg_exe] + [str(arg) for arg in args]

    try:
        return subprocess.run(cmd, check=check, **kwargs)
    except subprocess.CalledProcessError as e:
        stderr_msg = e.stderr.decode(errors="replace") if getattr(e, "stderr", None) else ""
        raise RuntimeError(f"Falha na execução do FFmpeg: {stderr_msg or e}") from e


def extract_audio_pcm(input_path: Path, output_wav: Path, sample_rate: int = 16000) -> Path:
    """
    Extrai ou converte o áudio de qualquer mídia (vídeo ou áudio) para formato WAV PCM 16-bit Mono,
    ideal para processamento por modelos de reconhecimento de fala (Whisper/ASR).
    """
    output_wav.parent.mkdir(parents=True, exist_ok=True)

    args = [
        "-y",
        "-i", str(input_path),
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", str(sample_rate),
        "-ac", "1",
        str(output_wav)
    ]

    run_ffmpeg(args, check=True)
    return output_wav
