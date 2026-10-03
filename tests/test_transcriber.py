import sys
import wave
import struct
import math
from pathlib import Path

# Adiciona o diretório raiz ao sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.append(str(root_dir))

from backend.services.ffmpeg_utils import get_ffmpeg_exe, extract_audio_pcm
from backend.services.transcriber import get_hardware_status, transcribe_media_file


def create_synthetic_wav(file_path: Path, duration_seconds: float = 2.0, freq: float = 440.0):
    sample_rate = 44100
    n_samples = int(sample_rate * duration_seconds)

    file_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file_path), "w") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)

        for i in range(n_samples):
            value = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            data = struct.pack("<h", value)
            wav_file.writeframes(data)


def test_transcription_pipeline():
    ffmpeg_exe = get_ffmpeg_exe()
    assert Path(ffmpeg_exe).exists()

    hw = get_hardware_status()
    assert "has_cuda" in hw

    test_dir = root_dir / "data" / "temp" / "test_pytest"
    test_dir.mkdir(parents=True, exist_ok=True)
    raw_audio = test_dir / "sample_synthetic.wav"
    create_synthetic_wav(raw_audio, duration_seconds=1.5)

    extracted_wav = test_dir / "sample_16k.wav"
    extract_audio_pcm(raw_audio, extracted_wav, sample_rate=16000)
    assert extracted_wav.exists()

    out_dir = test_dir / "transcription_output"
    result = transcribe_media_file(
        input_path=raw_audio,
        output_dir=out_dir,
        temp_dir=test_dir,
        model_size="tiny",
        vad_filter=False
    )

    assert result["status"] == "success"
    for k, fname in result["files"].items():
        assert (out_dir / fname).exists()

    import shutil
    shutil.rmtree(test_dir, ignore_errors=True)


if __name__ == "__main__":
    test_transcription_pipeline()
    print("Test passed successfully!")
