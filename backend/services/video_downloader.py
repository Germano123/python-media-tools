from pathlib import Path
from yt_dlp import YoutubeDL


def get_url_metadata(url: str) -> dict:
    """
    Extrai metadados da URL (vídeo ou playlist) sem realizar o download.
    """
    ydl_opts = {
        'extract_flat': 'in_playlist',
        'skip_download': True,
        'nocheckcertificate': True,
    }
    
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
    if not info:
        raise ValueError("Não foi possível obter informações da URL.")
        
    is_playlist = 'entries' in info or info.get('_type') == 'playlist'
    
    if is_playlist:
        videos = []
        for entry in info.get('entries', []):
            if not entry:
                continue
            video_id = entry.get('id')
            if video_id:
                videos.append({
                    "id": video_id,
                    "title": entry.get('title') or f"Vídeo {video_id}",
                    "url": f"https://www.youtube.com/watch?v={video_id}"
                })
        return {
            "is_playlist": True,
            "title": info.get('title') or "Playlist sem título",
            "videos": videos
        }
    else:
        return {
            "is_playlist": False,
            "title": info.get('title') or "Vídeo sem título",
            "id": info.get('id'),
            "url": url
        }


def download_single_video(url: str, output_dir: Path) -> Path:
    """
    Baixa um único vídeo do YouTube no formato MP4 (H.264 + AAC) para a pasta especificada.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': str(output_dir / '%(title)s.%(ext)s'),
        'merge_output_format': 'mp4',
        'nocheckcertificate': True,
    }

    
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        
        # Garante o caminho correto caso a extensão tenha mudado pós-merge
        filepath = Path(filename)
        if not filepath.exists():
            if filepath.with_suffix('.mp4').exists():
                filepath = filepath.with_suffix('.mp4')
            else:
                # Procura por arquivos com o mesmo nome na pasta
                parent = filepath.parent
                stem = filepath.stem
                for item in parent.iterdir():
                    if item.is_file() and item.stem == stem:
                        filepath = item
                        break
        return filepath
