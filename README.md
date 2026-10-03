# Media Tools HUB 💜

O **Media Tools HUB** é uma aplicação web local de código aberto que unifica diversas ferramentas úteis de processamento de mídia (áudio, vídeo e imagem) em uma única interface elegante, intuitiva e modular.

O projeto foi projetado com uma arquitetura flexível onde ferramentas (widgets do frontend) podem ser facilmente adicionadas ou removidas da página principal apenas incluindo ou comentando tags `<script>` no HTML principal.

---

## 🛠️ Ferramentas Disponíveis

1. **✂️ Cortador de Áudio & YouTube Downloader**:
   - Baixa arquivos de áudio do YouTube em formato `.mp3` usando `yt-dlp`.
   - Realiza múltiplos cortes em arquivos de áudio baseando-se em capítulos/faixas de tempo informados manualmente na tabela interativa da interface ou carregados via planilha CSV.
   - Gera um arquivo `.zip` com todas as faixas cortadas para fácil download.

2. **🎞️ Conversor de Vídeo para GIF**:
   - Converte trechos de arquivos de vídeo locais ou enviados via interface em GIFs animados usando OpenCV e Pillow.
   - Permite ajustar quadros por segundo (FPS), tempo de início do trecho, duração e largura do GIF.

3. **🔌 Mesclagem de Vídeos**:
   - Permite o envio de múltiplos vídeos, reordenação manual na interface e unificação de todos em um único arquivo de saída `.mp4` usando a biblioteca `MoviePy`.

4. **📄 Imagens para PDF**:
   - Junta múltiplos arquivos de imagem em um único arquivo PDF.
   - Permite ordenar as imagens arrastando-as/reordenando-as na interface gráfica antes da geração final.


5. **📄 Downloader de vídeos do YouTube**:
   - Faz download de links do YouTube.
   - Revisa links de playlist com múltipla seleção de downloads.

6. **🎙️ Transcrição & Legendas (Speech-to-Text)**:
   - Extrai automaticamente a faixa de áudio de arquivos de vídeo (`.mp4`, `.mov`, `.mkv`, etc.) ou áudio (`.mp3`, `.wav`, `.m4a`, etc.) e links do YouTube.
   - Realiza transcrição neural com `faster-whisper` acelerado via GPU NVIDIA (CUDA) ou CPU.
   - Exporta transcrição em texto puro (`.txt`), legendas (`.srt` e `.vtt`), metadados estruturados (`.json`) e pacote compactado (`.zip`).
   - Suporta múltiplos modelos (`tiny`, `base`, `small`, `medium`, `large-v3`), detecção automática de idioma e filtro de voz (VAD).

---

## 🏗️ Estrutura do Projeto

O projeto é dividido de forma limpa entre o backend de processamento de mídia e o frontend modular:

```
├── run.py                 # Script de inicialização automática
├── requirements.txt       # Requisitos unificados de bibliotecas do Python
├── backend/
│   ├── app.py             # Servidor Flask e rotas API com suporte a CORS para file:///
│   └── services/          # Serviços com a lógica de mídia dos projetos originais
│       ├── audio_cutter.py
│       ├── gif_converter.py
│       ├── video_merger.py
│       └── pdf_converter.py
├── frontend/
│   ├── index.html         # Página principal (HUB)
│   ├── style.css          # Estilo visual moderno nas cores roxo/cinza claro
│   ├── main.js            # Inicializador e registro dinâmico dos widgets
│   └── widgets/           # Código JavaScript isolado de cada ferramenta
│       ├── audio_cutter.js
│       ├── gif_converter.js
│       ├── video_merger.js
│       └── pdf_converter.js
└── data/                  # Diretório de trabalho local para arquivos temporários/inputs/outputs
    ├── inputs/            # Arquivos prontos para serem selecionados
    ├── outputs/           # Arquivos resultantes dos processamentos
    └── temp/              # Uploads temporários
```

---

## 🚀 Requisitos e Como Executar

### Pré-requisitos

1. **Python 3.10+** instalado.
2. O binário do **FFmpeg** é gerenciado automaticamente pelo projeto através do pacote `imageio-ffmpeg` (não é necessário configurar o FFmpeg manualmente nas variáveis de ambiente do Windows).
3. *(Opcional)* Placa de vídeo NVIDIA (GeForce RTX/GTX) para aceleração de transcrição por GPU via CUDA. Se não houver GPU, o sistema utilizará a CPU automaticamente.

### Configuração e Execução

1. Abra um terminal no diretório do projeto.
2. Crie e ative um ambiente virtual (opcional, mas recomendado):
   ```bash
   python -m venv .venv
   .venv\Scripts\activate      # Windows (PowerShell/CMD)
   source .venv/bin/activate   # Linux/macOS
   ```
3. Instale as dependências consolidadas:
   ```bash
   pip install -r requirements.txt
   ```
4. Execute o HUB:
   ```bash
   python run.py
   ```

O navegador abrirá automaticamente em `http://127.0.0.1:5000/`.

### Problemas ao baixar do YouTube

O projeto usa `yt-dlp` para obter os arquivos de mídia; não usa a YouTube Data API para o download. Para instalar a versão definida pelo projeto, execute novamente `python -m pip install -r requirements.txt`. Para investigar uma falha, rode:

```bash
python -m yt_dlp -v "URL_DO_VIDEO"
```

Um HTTP 403 pode indicar mudanças recentes no YouTube, restrição de acesso ao vídeo ou bloqueio temporário de rede/IP. Se o vídeo exigir login, use cookies da sua própria sessão conforme a documentação do `yt-dlp` e não compartilhe esses cookies. Uma falha de quota da YouTube Data API é um problema diferente.

---

## 🧩 Modulabilidade: Como Adicionar ou Remover Ferramentas

Para **remover** uma ferramenta da interface, basta abrir o arquivo [`frontend/index.html`](frontend/index.html) e comentar ou excluir a tag `<script>` do widget correspondente. Por exemplo:

```html
<!-- Para remover a ferramenta de Imagens para PDF, comente esta linha: -->
<!-- <script src="widgets/pdf_converter.js"></script> -->
```

Ao fazer isso, a aba correspondente no menu lateral desaparecerá instantaneamente no próximo carregamento da página, sem quebrar os outros módulos.

Para **adicionar** um novo script/ferramenta:
1. Crie seu script visual em `frontend/widgets/seu_script.js`.
2. Registre-o no HUB usando:
   ```javascript
   Hub.registerWidget({
       id: "seu-script-id",
       name: "Nome da Ferramenta",
       icon: "🚀",
       description: "O que ela faz...",
       init(container) {
           container.innerHTML = `<h3>Minha Interface</h3>`;
           // Seu código JS e eventos aqui...
       }
   });
   ```
3. Insira o script no final de `index.html`:
   ```html
   <script src="widgets/seu_script.js"></script>
   ```
4. Crie os endpoints necessários no Flask em `backend/app.py`.
