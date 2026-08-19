# Changelog 📝

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

## [1.1.0] - 2026-08-19

### Adicionado
- **Nova Ferramenta - YouTube Video Downloader**:
  - Novo serviço `backend/services/video_downloader.py` para extrair metadados e baixar vídeos do YouTube.
  - Novos endpoints `/api/video-downloader/info` e `/api/video-downloader/download` no `backend/app.py`.
  - Novo widget `frontend/widgets/video_downloader.js` com interface para análise de URLs, suporte a listagem de playlists com checkboxes e download em lote para formato MP4.
  - Registro e importação automática da ferramenta no painel do HUB.
- **Configurações**:
  - Arquivo `.gitignore` robusto configurado para Python, ambientes virtuais, IDEs e arquivos temporários/outputs locais de processamento de mídia (pasta `data/`).


## [1.0.0] - 2026-08-19

### Adicionado
- **Inicialização e Launcher**:
  - Script `run.py` para iniciar automaticamente o backend local e abrir o navegador padrão no HUB.
- **Ambiente de Dependências**:
  - `requirements.txt` unificado combinando as dependências de todos os projetos em um único arquivo de instalação rápida.
- **Backend Flask Centralizado**:
  - `backend/app.py` que centraliza as chamadas de API, aceita uploads de arquivos, manipula download de arquivos gerados e fornece segurança de diretórios.
  - Configuração manual de CORS no backend permitindo o consumo das APIs locais a partir de páginas do frontend rodando sob protocolo `file:///`.
- **Serviços de Mídia Isolados**:
  - `backend/services/audio_cutter.py` contendo a lógica de corte de áudio local via subprocesso FFmpeg e downloads do YouTube via `yt-dlp`.
  - `backend/services/gif_converter.py` contendo a lógica de exportação e redimensionamento de vídeos para GIF animado usando OpenCV e Pillow.
  - `backend/services/video_merger.py` contendo a lógica de concatenação e fusão de múltiplos arquivos de vídeo usando MoviePy.
  - `backend/services/pdf_converter.py` contendo a lógica de exportação e união de imagens ordenadas para um único documento PDF usando Pillow.
- **Interface Frontend Modular (HUB)**:
  - `frontend/index.html` contendo o esqueleto em grid com sidebar e painel de trabalho principal.
  - `frontend/style.css` projetado com paleta de cores sob medida: detalhes, botões e sidebar em tons roxos/violetas vibrantes e área de trabalho com gradiente cinza claro contemporâneo.
  - `frontend/main.js` atuando como barramento central de registro dinâmico dos widgets e ping de conexão com o servidor backend.
- **Widgets JavaScript Autônomos**:
  - `frontend/widgets/audio_cutter.js` com suporte a downloads diretos do YT, uploads locais, tabela de cortes editável e importador automático de CSV.
  - `frontend/widgets/gif_converter.js` com controles de FPS, corte de tempo, ajuste de tamanho em tempo real e preview em tela do GIF gerado.
  - `frontend/widgets/video_merger.js` com suporte a drag and drop de múltiplos vídeos, reordenação de itens (subir/descer) e merge remoto.
  - `frontend/widgets/pdf_converter.js` com suporte a drag and drop de imagens, ordenação inteligente de páginas e exportação final de PDF.

### Removido
- Repositórios e pastas base preexistentes que foram consolidados na raiz do projeto:
  - Subpasta `python-audio-cutter/`
  - Subpasta `python-media-tools/` (subdiretório interno)
  - Subpasta `python-pdf-converter/`
