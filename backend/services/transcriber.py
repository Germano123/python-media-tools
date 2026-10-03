import os
import gc
import json
import zipfile
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List

# Configura caminhos das DLLs da NVIDIA no Windows se instaladas via pip
def _setup_nvidia_dll_paths():
    if os.name != "nt":
        return
    try:
        import site
        for base in site.getsitepackages():
            nvidia_dir = Path(base) / "nvidia"
            if nvidia_dir.exists():
                for sub in ["cublas", "cudnn", "cuda_nvrtc", "cuda_runtime"]:
                    bin_path = nvidia_dir / sub / "bin"
                    if bin_path.exists():
                        try:
                            os.add_dll_directory(str(bin_path))
                        except Exception:
                            pass
                        os.environ["PATH"] = str(bin_path) + os.pathsep + os.environ.get("PATH", "")
    except Exception:
        pass

_setup_nvidia_dll_paths()

import ctranslate2
from faster_whisper import WhisperModel

try:
    from .ffmpeg_utils import extract_audio_pcm, run_ffmpeg
except ImportError:
    from services.ffmpeg_utils import extract_audio_pcm, run_ffmpeg

# Cache de modelos carregados na memória para alta performance
_CURRENT_MODEL: Optional[WhisperModel] = None
_CURRENT_MODEL_SIZE: Optional[str] = None
_CURRENT_DEVICE: Optional[str] = None


def format_timestamp_srt(seconds: float) -> str:
    """Converte segundos para o formato de tempo SRT: HH:MM:SS,mmm"""
    total_msec = int(round(seconds * 1000))
    hours = total_msec // 3600000
    remainder = total_msec % 3600000
    minutes = remainder // 60000
    remainder %= 60000
    secs = remainder // 1000
    msec = remainder % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{msec:03d}"


def format_timestamp_vtt(seconds: float) -> str:
    """Converte segundos para o formato de tempo WebVTT: HH:MM:SS.mmm"""
    total_msec = int(round(seconds * 1000))
    hours = total_msec // 3600000
    remainder = total_msec % 3600000
    minutes = remainder // 60000
    remainder %= 60000
    secs = remainder // 1000
    msec = remainder % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{msec:03d}"


def get_hardware_status() -> Dict[str, Any]:
    """
    Retorna o status de aceleração de hardware disponível no sistema.
    """
    cuda_devices = 0
    try:
        cuda_devices = ctranslate2.get_cuda_device_count()
    except Exception:
        pass

    has_cuda = cuda_devices > 0

    return {
        "has_cuda": has_cuda,
        "cuda_device_count": cuda_devices,
        "recommended_device": "cuda" if has_cuda else "cpu",
        "recommended_compute_type": "float16" if has_cuda else "int8",
        "available_models": [
            {"id": "tiny", "name": "Tiny (Ultra rápido, ~75MB)", "vram": "~500MB"},
            {"id": "base", "name": "Base (Rápido e leve, ~140MB)", "vram": "~1GB"},
            {"id": "small", "name": "Small (Recomendado - Ótima precisão em PT, ~460MB)", "vram": "~2GB"},
            {"id": "medium", "name": "Medium (Alta precisão para reuniões/áudios complexos, ~1.5GB)", "vram": "~4GB"},
            {"id": "large-v3", "name": "Large v3 (Precisão máxima profissional, ~3GB)", "vram": "~6GB"}
        ]
    }


def load_whisper_model(model_size: str = "base", preferred_device: Optional[str] = None) -> WhisperModel:
    """
    Carrega o modelo WhisperModel usando cache para evitar recarregamento pesado.
    Tenta GPU CUDA primeiro (se suportada) e realiza fallback automático para CPU caso necessário.
    """
    global _CURRENT_MODEL, _CURRENT_MODEL_SIZE, _CURRENT_DEVICE

    hw = get_hardware_status()
    device = preferred_device or hw["recommended_device"]
    compute_type = "float16" if device == "cuda" else "int8"

    if _CURRENT_MODEL is not None and _CURRENT_MODEL_SIZE == model_size and _CURRENT_DEVICE == device:
        return _CURRENT_MODEL

    # Se já havia um modelo carregado diferente, libera memória
    if _CURRENT_MODEL is not None:
        del _CURRENT_MODEL
        gc.collect()

    try:
        if device == "cuda":
            model = WhisperModel(model_size, device="cuda", compute_type=compute_type)
            _CURRENT_DEVICE = "cuda"
        else:
            model = WhisperModel(model_size, device="cpu", compute_type="int8")
            _CURRENT_DEVICE = "cpu"
    except Exception as e:
        print(f"[WhisperModel] Fallback para CPU devido a: {e}")
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        _CURRENT_DEVICE = "cpu"

    _CURRENT_MODEL = model
    _CURRENT_MODEL_SIZE = model_size
    return _CURRENT_MODEL


def transcribe_media_file(
    input_path: Path,
    output_dir: Path,
    temp_dir: Path,
    model_size: str = "base",
    language: Optional[str] = None,
    task: str = "transcribe",
    word_timestamps: bool = True,
    vad_filter: bool = True
) -> Dict[str, Any]:
    """
    Executa o fluxo completo de extração e transcrição:
    1. Extrai a trilha de áudio da mídia para WAV 16kHz Mono temporário.
    2. Transcreve com faster-whisper (GPU com fallback automático para CPU).
    3. Gera arquivos .txt, .srt, .vtt, .json e compacta tudo em .zip.
    4. Limpa arquivos temporários intermediários.
    """
    global _CURRENT_MODEL, _CURRENT_DEVICE
    output_dir.mkdir(parents=True, exist_ok=True)
    temp_dir.mkdir(parents=True, exist_ok=True)

    base_name = input_path.stem
    temp_wav = temp_dir / f"transcribe_temp_{input_path.stem}_{os.getpid()}.wav"

    try:
        # Passo 1: Extrair áudio padronizado (16kHz, mono, PCM)
        extract_audio_pcm(input_path, temp_wav, sample_rate=16000)

        # Passo 2: Executar transcrição (com resiliência a fallback CUDA -> CPU)
        def _execute_transcription(target_model):
            return target_model.transcribe(
                str(temp_wav),
                language=language if language and language != "auto" else None,
                task=task,
                beam_size=5,
                word_timestamps=word_timestamps,
                vad_filter=vad_filter,
                vad_parameters=dict(min_silence_duration_ms=500) if vad_filter else None
            )

        model = load_whisper_model(model_size=model_size)

        try:
            segments_generator, info = _execute_transcription(model)
            # Testar a leitura do primeiro segmento para capturar erros tardios de CUDA
            segments_list = []
            full_text_list = []
            srt_lines = []
            vtt_lines = ["WEBVTT", ""]

            for idx, segment in enumerate(segments_generator, start=1):
                seg_text = segment.text.strip()
                full_text_list.append(seg_text)

                words_data = []
                if getattr(segment, "words", None):
                    for w in segment.words:
                        words_data.append({
                            "word": w.word,
                            "start": round(w.start, 3),
                            "end": round(w.end, 3),
                            "probability": round(w.probability, 3)
                        })

                segments_list.append({
                    "id": idx,
                    "start": round(segment.start, 3),
                    "end": round(segment.end, 3),
                    "text": seg_text,
                    "words": words_data
                })

                srt_start = format_timestamp_srt(segment.start)
                srt_end = format_timestamp_srt(segment.end)
                srt_lines.append(f"{idx}\n{srt_start} --> {srt_end}\n{seg_text}\n")

                vtt_start = format_timestamp_vtt(segment.start)
                vtt_end = format_timestamp_vtt(segment.end)
                vtt_lines.append(f"{vtt_start} --> {vtt_end}\n{seg_text}\n")

        except Exception as cuda_err:
            if _CURRENT_DEVICE == "cuda":
                print(f"[WhisperModel] Erro em CUDA ({cuda_err}), repetindo transcrição em modo CPU...")
                model = load_whisper_model(model_size=model_size, preferred_device="cpu")
                segments_generator, info = _execute_transcription(model)

                segments_list = []
                full_text_list = []
                srt_lines = []
                vtt_lines = ["WEBVTT", ""]

                for idx, segment in enumerate(segments_generator, start=1):
                    seg_text = segment.text.strip()
                    full_text_list.append(seg_text)

                    words_data = []
                    if getattr(segment, "words", None):
                        for w in segment.words:
                            words_data.append({
                                "word": w.word,
                                "start": round(w.start, 3),
                                "end": round(w.end, 3),
                                "probability": round(w.probability, 3)
                            })

                    segments_list.append({
                        "id": idx,
                        "start": round(segment.start, 3),
                        "end": round(segment.end, 3),
                        "text": seg_text,
                        "words": words_data
                    })

                    srt_start = format_timestamp_srt(segment.start)
                    srt_end = format_timestamp_srt(segment.end)
                    srt_lines.append(f"{idx}\n{srt_start} --> {srt_end}\n{seg_text}\n")

                    vtt_start = format_timestamp_vtt(segment.start)
                    vtt_end = format_timestamp_vtt(segment.end)
                    vtt_lines.append(f"{vtt_start} --> {vtt_end}\n{seg_text}\n")
            else:
                raise cuda_err

        full_text = "\n\n".join(full_text_list)

        # Salvar Arquivos Finais
        txt_path = output_dir / f"{base_name}_transcricao.txt"
        srt_path = output_dir / f"{base_name}_legendas.srt"
        vtt_path = output_dir / f"{base_name}_legendas.vtt"
        json_path = output_dir / f"{base_name}_dados.json"
        zip_path = output_dir / f"{base_name}_pacote_transcricao.zip"

        txt_path.write_text(full_text, encoding="utf-8")
        srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
        vtt_path.write_text("\n".join(vtt_lines), encoding="utf-8")

        metadata = {
            "media_name": input_path.name,
            "detected_language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration_seconds": round(info.duration, 2),
            "model_size": model_size,
            "device": _CURRENT_DEVICE,
            "segments_count": len(segments_list),
            "segments": segments_list
        }

        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(metadata, jf, ensure_ascii=False, indent=2)

        # Criar pacote ZIP unificado
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.write(txt_path, arcname=txt_path.name)
            zf.write(srt_path, arcname=srt_path.name)
            zf.write(vtt_path, arcname=vtt_path.name)
            zf.write(json_path, arcname=json_path.name)

        return {
            "status": "success",
            "detected_language": info.language,
            "language_probability": round(info.language_probability, 4),
            "duration": round(info.duration, 2),
            "device_used": _CURRENT_DEVICE,
            "full_text": full_text,
            "segments_count": len(segments_list),
            "segments": segments_list[:50],
            "files": {
                "txt": txt_path.name,
                "srt": srt_path.name,
                "vtt": vtt_path.name,
                "json": json_path.name,
                "zip": zip_path.name,
            }
        }

    finally:
        if temp_wav.exists():
            try:
                temp_wav.unlink(missing_ok=True)
            except Exception:
                pass
