import os
import sys
import shutil
import zipfile
import time
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory, abort

# Garantir que o diretório do backend esteja no PYTHONPATH
sys.path.append(str(Path(__file__).resolve().parent))

# Importando os serviços locais
from services.audio_cutter import download_from_youtube, cut_audio, convert_mp4_to_mp3
from services.gif_converter import video_to_gif
from services.video_merger import merge_video_paths
from services.pdf_converter import images_to_pdf
from services.video_downloader import get_url_metadata, download_single_video



app = Flask(__name__, static_folder="../frontend", static_url_path="")

# Limite de tamanho de upload (ex: 500 MB para suportar vídeos)
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

# Diretórios de dados do HUB
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
INPUTS_DIR = DATA_DIR / "inputs"
OUTPUTS_DIR = DATA_DIR / "outputs"
TEMP_DIR = DATA_DIR / "temp"

# Inicializa as pastas necessárias
for folder in [INPUTS_DIR, OUTPUTS_DIR, TEMP_DIR]:
    folder.mkdir(parents=True, exist_ok=True)


# Configura CORS manualmente para todas as rotas
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    return response


# Rota raiz para servir o frontend
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")


# Download de arquivos gerados (outputs)
@app.route("/api/outputs/<path:filepath>")
def serve_output(filepath):
    # Evitar falhas de segurança por travessia de diretório
    safe_path = (OUTPUTS_DIR / filepath).resolve()
    if not safe_path.is_relative_to(OUTPUTS_DIR.resolve()):
        abort(403)
    if not safe_path.exists():
        abort(404)
    return send_from_directory(OUTPUTS_DIR, filepath, as_attachment=True)


# Listar arquivos na pasta inputs
@app.route("/api/inputs", methods=["GET"])
def list_inputs():
    media_type = request.args.get("type", "all") # all, audio, video, image
    
    audio_exts = {".mp3", ".wav", ".m4a", ".mp4"}
    video_exts = {".mp4", ".mov", ".avi", ".mkv", ".webm"}
    image_exts = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}
    
    files = []
    if INPUTS_DIR.exists():
        for item in INPUTS_DIR.iterdir():
            if item.is_file():
                ext = item.suffix.lower()
                is_match = False
                if media_type == "all":
                    is_match = True
                elif media_type == "audio" and ext in audio_exts:
                    is_match = True
                elif media_type == "video" and ext in video_exts:
                    is_match = True
                elif media_type == "image" and ext in image_exts:
                    is_match = True
                
                if is_match:
                    files.append({
                        "name": item.name,
                        "size": item.stat().st_size,
                        "modified": item.stat().st_mtime
                    })
    
    # Ordenar pelos mais recentes
    files.sort(key=lambda x: x["modified"], reverse=True)
    return jsonify(files)


# Upload de arquivos para o servidor
@app.route("/api/upload", methods=["POST"])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
    uploaded_file = request.files['file']
    if uploaded_file.filename == '':
        return jsonify({"error": "Nome de arquivo vazio"}), 400
        
    target = request.form.get("target", "temp") # temp ou inputs
    dest_dir = INPUTS_DIR if target == "inputs" else TEMP_DIR
    
    filename = uploaded_file.filename
    dest_path = dest_dir / filename
    
    uploaded_file.save(str(dest_path))
    
    return jsonify({
        "status": "success",
        "filename": filename,
        "path": str(dest_path),
        "size": dest_path.stat().st_size
    })


# API: Baixar do YouTube (Audio Cutter)
@app.route("/api/audio-cutter/download", methods=["POST"])
def api_audio_download():
    data = request.json or {}
    url = data.get("url")
    filename = data.get("filename")
    
    if not url or not filename:
        return jsonify({"error": "Os campos 'url' e 'filename' são obrigatórios"}), 400
        
    # Limpa o nome do arquivo para garantir extensão mp3
    if not filename.endswith(".mp3"):
        filename += ".mp3"
        
    dest_path = INPUTS_DIR / filename
    
    try:
        download_from_youtube(url, dest_path)
        return jsonify({
            "status": "success",
            "filename": filename,
            "size": dest_path.stat().st_size
        })
    except Exception as e:
        return jsonify({"error": f"Erro no download: {str(e)}"}), 500


# API: Cortar Áudio
@app.route("/api/audio-cutter/cut", methods=["POST"])
def api_audio_cut():
    data = request.json or {}
    audio_filename = data.get("audio_file") # arquivo na pasta inputs
    chapters = data.get("chapters") # lista de {"name": "...", "start": "..."}
    
    if not audio_filename or not chapters:
        return jsonify({"error": "Os campos 'audio_file' e 'chapters' são obrigatórios"}), 400
        
    audio_path = INPUTS_DIR / audio_filename
    if not audio_path.exists():
        return jsonify({"error": f"Arquivo {audio_filename} não encontrado na pasta inputs."}), 404
        
    # Se for mp4, converter para mp3 antes de cortar
    if audio_path.suffix.lower() == ".mp4":
        converted_path = INPUTS_DIR / f"{audio_path.stem}_converted.mp3"
        if not converted_path.exists():
            try:
                convert_mp4_to_mp3(audio_path, converted_path)
            except Exception as e:
                return jsonify({"error": f"Falha na conversão de MP4 para MP3: {str(e)}"}), 500
        audio_path = converted_path

    music_name = audio_path.stem
    output_subdir = OUTPUTS_DIR / "audio-cutter" / music_name
    
    try:
        created_files = cut_audio(audio_path, chapters, output_subdir)
        
        # Empacota em um arquivo ZIP para fácil download do usuário
        zip_filename = f"{music_name}_cortes.zip"
        zip_path = OUTPUTS_DIR / "audio-cutter" / zip_filename
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file in created_files:
                zip_file.write(file, arcname=file.name)
                
        return jsonify({
            "status": "success",
            "zip_url": f"/api/outputs/audio-cutter/{zip_filename}",
            "files": [f.name for f in created_files]
        })
    except Exception as e:
        return jsonify({"error": f"Erro no corte de áudio: {str(e)}"}), 500


# API: Conversão de Vídeo para GIF
@app.route("/api/gif-converter/convert", methods=["POST"])
def api_gif_convert():
    # Suporta tanto arquivos enviados diretamente (multipart) quanto já existentes em inputs
    if 'file' in request.files:
        video_file = request.files['file']
        temp_video_path = TEMP_DIR / f"temp_{int(time.time())}_{video_file.filename}"
        video_file.save(str(temp_video_path))
        input_path = temp_video_path
        cleanup_input = True
    else:
        data = request.json or {}
        video_filename = data.get("video_file")
        if not video_filename:
            return jsonify({"error": "Nenhum arquivo de vídeo fornecido"}), 400
        input_path = INPUTS_DIR / video_filename
        cleanup_input = False
        
    if not input_path.exists():
        return jsonify({"error": "Arquivo de vídeo não encontrado."}), 404
        
    fps = int(request.form.get("fps", 10) if 'file' in request.files else request.json.get("fps", 10))
    start_time = float(request.form.get("start_time", 0) if 'file' in request.files else request.json.get("start_time", 0))
    duration = request.form.get("duration") if 'file' in request.files else request.json.get("duration")
    resize_width = request.form.get("resize_width") if 'file' in request.files else request.json.get("resize_width")
    
    if duration:
        duration = float(duration) if float(duration) > 0 else None
    if resize_width:
        resize_width = int(resize_width) if int(resize_width) > 0 else None
        
    gif_name = f"gif_{int(time.time())}.gif"
    output_path = OUTPUTS_DIR / "gif-converter" / gif_name
    
    try:
        video_to_gif(
            input_video=input_path,
            output_gif=output_path,
            fps=fps,
            start_time=start_time,
            duration=duration,
            resize_width=resize_width
        )
        
        return jsonify({
            "status": "success",
            "gif_url": f"/api/outputs/gif-converter/{gif_name}"
        })
    except Exception as e:
        return jsonify({"error": f"Erro na geração do GIF: {str(e)}"}), 500
    finally:
        if cleanup_input and input_path.exists():
            input_path.unlink()


# API: União de Vídeos
@app.route("/api/video-merger/merge", methods=["POST"])
def api_video_merge():
    # Espera arquivos de vídeo enviados via multipart
    uploaded_files = request.files.getlist("files")
    if not uploaded_files or len(uploaded_files) < 2:
        return jsonify({"error": "Envie pelo menos 2 vídeos para mesclar"}), 400
        
    temp_paths = []
    try:
        # Salva em temp preservando a ordem do upload
        for i, file in enumerate(uploaded_files):
            temp_path = TEMP_DIR / f"merge_{i:03d}_{int(time.time())}_{file.filename}"
            file.save(str(temp_path))
            temp_paths.append(temp_path)
            
        merged_name = f"merged_{int(time.time())}.mp4"
        output_path = OUTPUTS_DIR / "video-merger" / merged_name
        
        merge_video_paths(temp_paths, output_path)
        
        return jsonify({
            "status": "success",
            "video_url": f"/api/outputs/video-merger/{merged_name}"
        })
    except Exception as e:
        return jsonify({"error": f"Erro ao mesclar vídeos: {str(e)}"}), 500
    finally:
        # Limpar arquivos temporários
        for path in temp_paths:
            if path.exists():
                try:
                    path.unlink()
                except Exception:
                    pass


# API: Imagens para PDF
@app.route("/api/pdf-converter/convert", methods=["POST"])
def api_pdf_convert():
    # Espera imagens enviadas via multipart
    uploaded_files = request.files.getlist("files")
    if not uploaded_files:
        return jsonify({"error": "Envie pelo menos 1 imagem para converter"}), 400
        
    temp_paths = []
    try:
        # Salva em temp
        for i, file in enumerate(uploaded_files):
            temp_path = TEMP_DIR / f"pdf_{i:03d}_{int(time.time())}_{file.filename}"
            file.save(str(temp_path))
            temp_paths.append(temp_path)
            
        pdf_name = f"converted_{int(time.time())}.pdf"
        output_path = OUTPUTS_DIR / "pdf-converter" / pdf_name
        
        images_to_pdf(temp_paths, output_path)
        
        return jsonify({
            "status": "success",
            "pdf_url": f"/api/outputs/pdf-converter/{pdf_name}"
        })
    except Exception as e:
        return jsonify({"error": f"Erro ao converter para PDF: {str(e)}"}), 500
    finally:
        # Limpar arquivos temporários
        for path in temp_paths:
            if path.exists():
                try:
                    path.unlink()
                except Exception:
                    pass


# API: Obter Informações de Vídeo ou Playlist do YouTube
@app.route("/api/video-downloader/info", methods=["POST"])
def api_video_info():
    data = request.json or {}
    url = data.get("url")
    if not url:
        return jsonify({"error": "A URL é obrigatória"}), 400
    try:
        metadata = get_url_metadata(url)
        return jsonify(metadata)
    except Exception as e:
        return jsonify({"error": f"Falha ao analisar a URL: {str(e)}"}), 500


# API: Baixar Vídeos Selecionados do YouTube
@app.route("/api/video-downloader/download", methods=["POST"])
def api_video_download():
    data = request.json or {}
    urls = data.get("urls")
    if not urls:
        return jsonify({"error": "A lista de URLs é obrigatória"}), 400
        
    output_subdir = OUTPUTS_DIR / "video-downloader"
    output_subdir.mkdir(parents=True, exist_ok=True)
    
    downloaded_files = []
    errors = []
    
    for url in urls:
        try:
            filepath = download_single_video(url, output_subdir)
            downloaded_files.append({
                "name": filepath.name,
                "url": f"/api/outputs/video-downloader/{filepath.name}"
            })
        except Exception as e:
            errors.append({
                "url": url,
                "error": str(e)
            })
            
    return jsonify({
        "status": "success" if not errors else "partial_success" if downloaded_files else "error",
        "files": downloaded_files,
        "errors": errors
    })


# Servir arquivos estáticos do frontend (CSS, JS, widgets, etc.) - Deve ser a última rota
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

