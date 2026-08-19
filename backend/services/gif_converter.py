import cv2
from PIL import Image
import os


def video_to_gif(
    input_video,
    output_gif,
    fps=10,
    start_time=0,
    duration=None,
    resize_width=None
):
    cap = cv2.VideoCapture(str(input_video))

    if not cap.isOpened():
        raise RuntimeError(f"Não foi possível abrir o vídeo: {input_video}")

    video_fps = cap.get(cv2.CAP_PROP_FPS)

    if video_fps <= 0:
        raise RuntimeError("Não foi possível determinar o FPS do vídeo.")

    start_frame = int(start_time * video_fps)

    if start_frame > 0:
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

    max_frames = None

    if duration is not None and duration > 0:
        max_frames = int(duration * video_fps)

    frames = []
    frame_count = 0

    while True:
        success, frame = cap.read()

        if not success:
            break

        if max_frames is not None and frame_count >= max_frames:
            break

        # OpenCV usa BGR, Pillow usa RGB
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        image = Image.fromarray(frame)

        if resize_width is not None and resize_width > 0:
            width, height = image.size
            resize_height = int(height * (resize_width / width))
            image = image.resize(
                (resize_width, resize_height),
                Image.Resampling.LANCZOS
            )

        frames.append(image)
        frame_count += 1

    cap.release()

    if not frames:
        raise RuntimeError("Nenhum frame foi extraído do vídeo.")

    os.makedirs(os.path.dirname(output_gif) or ".", exist_ok=True)

    # Converte o FPS desejado para duração de cada frame em milissegundos
    frame_duration = int(1000 / fps)

    frames[0].save(
        str(output_gif),
        save_all=True,
        append_images=frames[1:],
        duration=frame_duration,
        loop=0,
        optimize=False
    )

    return len(frames)
