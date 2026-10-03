// Widget: Transcrição de Áudio e Vídeo & Gerador de Legendas
Hub.registerWidget({
    id: "transcriber",
    name: "Transcrição & Legendas",
    icon: "🎙️",
    description: "Extraia o áudio de vídeos ou gravações e transcreva automaticamente para texto puro, legendas SRT/VTT e JSON estruturado.",

    init(container) {
        container.innerHTML = `
            <div class="widget-section">
                <!-- Cabeçalho com indicador de Hardware -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: var(--purple-main); margin: 0;">1. Selecionar Arquivo ou Link de Mídia</h3>
                    <div id="hw-badge-container">
                        <span class="badge-hw cpu" id="hw-status-badge">Verificando aceleração...</span>
                    </div>
                </div>

                <!-- Modos de Entrada -->
                <div class="form-row">
                    <!-- Opção A: Upload Local de Mídia -->
                    <div class="form-group" style="border-right: 1px solid var(--border-color); padding-right: 20px;">
                        <label>Enviar Vídeo ou Áudio Local</label>
                        <div class="upload-zone" id="transcribe-upload-zone">
                            <span class="upload-zone-icon">🎬</span>
                            <p>Arraste um vídeo/áudio ou <strong>clique aqui</strong></p>
                            <span style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 5px;">
                                Suporta MP4, MKV, MOV, WEBM, MP3, WAV, M4A, OGG, FLAC
                            </span>
                            <input type="file" id="transcribe-file-input" accept="video/*,audio/*" style="display: none;">
                        </div>
                    </div>

                    <!-- Opção B: Download Direto do YouTube -->
                    <div class="form-group">
                        <label>Ou Transcrever Direto do YouTube</label>
                        <input type="url" id="transcribe-yt-url" placeholder="https://www.youtube.com/watch?v=..." style="margin-bottom: 12px;">
                        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
                            O áudio será extraído e transcrito automaticamente em alta velocidade.
                        </p>
                    </div>
                </div>

                <!-- Seleção de Arquivo existente em inputs/ -->
                <div class="form-group" style="margin-top: 15px;">
                    <label for="select-transcribe-media">Ou Escolher da Pasta <code>data/inputs/</code></label>
                    <select id="select-transcribe-media">
                        <option value="">-- Carregando arquivos de inputs/ --</option>
                    </select>
                </div>

                <hr style="border: none; border-top: 1px solid var(--border-color); margin: 25px 0;">

                <!-- Seção 2: Configurações do Modelo de IA -->
                <h3 style="margin-bottom: 15px; color: var(--purple-main)">2. Configurações da Transcrição</h3>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="transcribe-model-size">Modelo de Transcrição (Whisper)</label>
                        <select id="transcribe-model-size">
                            <option value="base" selected>Base (Rápido e Leve - Recomendado para testes)</option>
                            <option value="small">Small (Equilíbrio ideal: Alta Precisão em PT-BR)</option>
                            <option value="medium">Medium (Qualidade Avançada para termos técnicos)</option>
                            <option value="tiny">Tiny (Ultra Rápido)</option>
                            <option value="large-v3">Large v3 (Qualidade Máxima Profissional)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="transcribe-language">Idioma do Áudio</label>
                        <select id="transcribe-language">
                            <option value="auto" selected>Detectar Automaticamente</option>
                            <option value="pt">Português</option>
                            <option value="en">Inglês</option>
                            <option value="es">Espanhol</option>
                            <option value="fr">Francês</option>
                            <option value="de">Alemão</option>
                            <option value="it">Italiano</option>
                        </select>
                    </div>
                </div>

                <div class="form-row" style="margin-top: 10px;">
                    <div class="form-group">
                        <label for="transcribe-task">Ação Desejada</label>
                        <select id="transcribe-task">
                            <option value="transcribe" selected>Transcrever Fala no Idioma Original</option>
                            <option value="translate">Traduzir Fala Diretamente para Inglês</option>
                        </select>
                    </div>

                    <div class="form-group" style="display: flex; flex-direction: column; justify-content: center;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 8px;">
                            <input type="checkbox" id="transcribe-vad" checked>
                            <span>Filtro de Atividade de Voz (VAD - Remove silêncios)</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="transcribe-word-timestamps" checked>
                            <span>Gerar Timestamps precisos por palavra</span>
                        </label>
                    </div>
                </div>

                <!-- Botão de Iniciar -->
                <button class="btn btn-primary" id="btn-start-transcribe" style="margin-top: 25px; width: 100%; font-size: 16px; padding: 15px;">
                    🎙️ Iniciar Extração & Transcrição
                </button>

                <!-- Barra de Progresso / Status -->
                <div class="progress-container" id="transcribe-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="transcribe-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="transcribe-status-text">Processando...</span>
                    </div>
                </div>

                <!-- Caixa de Erro -->
                <div class="result-box error-box" id="transcribe-error-box">
                    <div class="result-title">❌ Erro no Processamento</div>
                    <div class="result-content" id="transcribe-error-content"></div>
                </div>

                <!-- Painel de Resultados -->
                <div class="result-box" id="transcribe-result-box" style="padding: 24px;">
                    <div class="result-title">
                        <span>✅ Transcrição Concluída com Sucesso!</span>
                    </div>

                    <!-- Métricas de Processamento -->
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0 20px 0; background: var(--bg-card); padding: 15px; border-radius: var(--border-radius); border: 1px solid var(--border-color);">
                        <div><strong>Idioma:</strong> <span id="res-language">-</span></div>
                        <div><strong>Confiança:</strong> <span id="res-confidence">-</span></div>
                        <div><strong>Duração:</strong> <span id="res-duration">-</span></div>
                        <div><strong>Dispositivo:</strong> <span id="res-device">-</span></div>
                        <div><strong>Segmentos:</strong> <span id="res-segments-count">-</span></div>
                    </div>

                    <!-- Abas de Visualização -->
                    <div class="transcription-nav-tabs">
                        <button class="transcription-tab-btn active" data-tab="tab-text">📝 Texto Completo</button>
                        <button class="transcription-tab-btn" data-tab="tab-srt">⏱️ Legendas (SRT)</button>
                        <button class="transcription-tab-btn" data-tab="tab-segments">📑 Segmentos Detalhados</button>
                    </div>

                    <!-- Conteúdo das Abas -->
                    <div id="tab-text" class="tab-pane-content">
                        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                            <button class="btn btn-secondary btn-sm" id="btn-copy-text">📋 Copiar Texto</button>
                        </div>
                        <textarea class="transcription-box" id="transcribe-text-output" readonly></textarea>
                    </div>

                    <div id="tab-srt" class="tab-pane-content" style="display: none;">
                        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
                            <button class="btn btn-secondary btn-sm" id="btn-copy-srt">📋 Copiar SRT</button>
                        </div>
                        <textarea class="transcription-box" id="transcribe-srt-output" style="font-family: monospace; font-size: 13px;" readonly></textarea>
                    </div>

                    <div id="tab-segments" class="tab-pane-content" style="display: none;">
                        <div class="segments-list" id="transcribe-segments-list"></div>
                    </div>

                    <!-- Grade de Downloads -->
                    <h4 style="margin: 25px 0 10px 0; color: var(--purple-main);">Arquivos para Download</h4>
                    <div class="download-grid">
                        <a href="#" target="_blank" class="btn btn-secondary" id="btn-dl-txt">📄 Baixar .TXT</a>
                        <a href="#" target="_blank" class="btn btn-secondary" id="btn-dl-srt">⏱️ Baixar .SRT</a>
                        <a href="#" target="_blank" class="btn btn-secondary" id="btn-dl-vtt">🌐 Baixar .VTT</a>
                        <a href="#" target="_blank" class="btn btn-secondary" id="btn-dl-json">📊 Baixar .JSON</a>
                    </div>
                    <a href="#" target="_blank" class="btn btn-primary" id="btn-dl-zip" style="margin-top: 12px; width: 100%; text-align: center;">
                        📦 Baixar Pacote Completo (.ZIP)
                    </a>
                </div>
            </div>
        `;

        this.bindEvents();
        this.checkHardwareStatus();
        this.loadMediaList();
    },

    // Consulta status do hardware (GPU vs CPU)
    async checkHardwareStatus() {
        const badge = document.getElementById("hw-status-badge");
        try {
            const res = await fetch(`${Hub.apiBase}/api/transcriber/info`);
            const data = await res.json();
            if (data.has_cuda) {
                badge.className = "badge-hw cuda";
                badge.innerHTML = `⚡ GPU Ativa (NVIDIA CUDA - ${data.cuda_device_count}x)`;
                // Se tiver GPU, seleciona o modelo 'small' como padrão pela precisão superior
                const selectModel = document.getElementById("transcribe-model-size");
                if (selectModel) selectModel.value = "small";
            } else {
                badge.className = "badge-hw cpu";
                badge.innerHTML = `💻 Modo CPU (Multithreading)`;
            }
        } catch (e) {
            badge.className = "badge-hw cpu";
            badge.textContent = "💻 Modo CPU";
        }
    },

    // Carrega lista de arquivos de áudio/vídeo em data/inputs/
    async loadMediaList() {
        const select = document.getElementById("select-transcribe-media");
        try {
            const res = await fetch(`${Hub.apiBase}/api/inputs?type=media`);
            const files = await res.json();
            select.innerHTML = '<option value="">-- Selecione um arquivo existente ou envie acima --</option>';
            files.forEach(file => {
                const opt = document.createElement("option");
                opt.value = file.name;
                opt.textContent = `${file.name} (${Hub.formatBytes(file.size)})`;
                select.appendChild(opt);
            });
        } catch (e) {
            select.innerHTML = '<option value="">Erro ao listar mídias</option>';
        }
    },

    bindEvents() {
        const uploadZone = document.getElementById("transcribe-upload-zone");
        const fileInput = document.getElementById("transcribe-file-input");
        const ytInput = document.getElementById("transcribe-yt-url");
        const mediaSelect = document.getElementById("select-transcribe-media");

        const btnStart = document.getElementById("btn-start-transcribe");
        const progressContainer = document.getElementById("transcribe-progress-container");
        const progressBar = document.getElementById("transcribe-progress-bar");
        const statusText = document.getElementById("transcribe-status-text");

        const resultBox = document.getElementById("transcribe-result-box");
        const errorBox = document.getElementById("transcribe-error-box");
        const errorContent = document.getElementById("transcribe-error-content");

        let uploadedFile = null;

        // Upload Drag & Drop
        uploadZone.addEventListener("click", () => fileInput.click());

        uploadZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadZone.classList.add("dragover");
        });

        uploadZone.addEventListener("dragleave", () => {
            uploadZone.classList.remove("dragover");
        });

        uploadZone.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadZone.classList.remove("dragover");
            if (e.dataTransfer.files.length > 0) {
                uploadedFile = e.dataTransfer.files[0];
                this.updateUploadPreview(uploadedFile);
                mediaSelect.value = "";
                ytInput.value = "";
            }
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                uploadedFile = fileInput.files[0];
                this.updateUploadPreview(uploadedFile);
                mediaSelect.value = "";
                ytInput.value = "";
            }
        });

        // Alternância de abas de prévia
        const tabBtns = document.querySelectorAll(".transcription-tab-btn");
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                tabBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");

                const targetTab = btn.getAttribute("data-tab");
                document.querySelectorAll(".tab-pane-content").forEach(pane => {
                    pane.style.display = pane.id === targetTab ? "block" : "none";
                });
            });
        });

        // Botões de cópia
        document.getElementById("btn-copy-text").addEventListener("click", () => {
            const text = document.getElementById("transcribe-text-output").value;
            navigator.clipboard.writeText(text).then(() => alert("Texto copiado para a área de transferência!"));
        });

        document.getElementById("btn-copy-srt").addEventListener("click", () => {
            const srt = document.getElementById("transcribe-srt-output").value;
            navigator.clipboard.writeText(srt).then(() => alert("Legenda SRT copiada para a área de transferência!"));
        });

        // Início da Transcrição
        btnStart.addEventListener("click", async () => {
            const ytUrl = ytInput.value.trim();
            const selectedMedia = mediaSelect.value;
            const modelSize = document.getElementById("transcribe-model-size").value;
            const language = document.getElementById("transcribe-language").value;
            const task = document.getElementById("transcribe-task").value;
            const vadFilter = document.getElementById("transcribe-vad").checked;
            const wordTimestamps = document.getElementById("transcribe-word-timestamps").checked;

            if (!uploadedFile && !selectedMedia && !ytUrl) {
                alert("Por favor, selecione um arquivo de mídia, faça upload ou insira uma URL do YouTube.");
                return;
            }

            // Iniciar UI de processamento
            resultBox.style.display = "none";
            errorBox.style.display = "none";
            progressContainer.style.display = "block";
            progressBar.style.width = "25%";
            statusText.textContent = "Extraindo áudio da mídia e carregando modelo Whisper...";
            btnStart.disabled = true;

            try {
                let response;

                if (uploadedFile) {
                    const formData = new FormData();
                    formData.append("file", uploadedFile);
                    formData.append("model_size", modelSize);
                    formData.append("language", language);
                    formData.append("task", task);
                    formData.append("vad_filter", vadFilter ? "true" : "false");
                    formData.append("word_timestamps", wordTimestamps ? "true" : "false");

                    progressBar.style.width = "40%";
                    statusText.textContent = "Enviando arquivo e transcrevendo via rede neural...";

                    response = await fetch(`${Hub.apiBase}/api/transcriber/transcribe`, {
                        method: "POST",
                        body: formData
                    });
                } else {
                    const payload = {
                        model_size: modelSize,
                        language: language,
                        task: task,
                        vad_filter: vadFilter,
                        word_timestamps: wordTimestamps
                    };

                    if (ytUrl) {
                        payload.youtube_url = ytUrl;
                        statusText.textContent = "Baixando áudio do YouTube e transcrevendo...";
                    } else {
                        payload.media_file = selectedMedia;
                        statusText.textContent = "Extraindo trilha de áudio e transcrevendo...";
                    }

                    progressBar.style.width = "45%";

                    response = await fetch(`${Hub.apiBase}/api/transcriber/transcribe`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                }

                progressBar.style.width = "85%";
                statusText.textContent = "Formatando legendas e relatórios...";

                const data = await response.json();

                if (data.error) {
                    progressContainer.style.display = "none";
                    errorBox.style.display = "block";
                    errorContent.textContent = data.error;
                } else {
                    progressBar.style.width = "100%";
                    setTimeout(() => {
                        progressContainer.style.display = "none";
                        this.renderResults(data);
                    }, 400);
                }

            } catch (err) {
                progressContainer.style.display = "none";
                errorBox.style.display = "block";
                errorContent.textContent = "Erro de conexão com o servidor: " + err.message;
            } finally {
                btnStart.disabled = false;
            }
        });
    },

    updateUploadPreview(file) {
        const uploadZone = document.getElementById("transcribe-upload-zone");
        uploadZone.innerHTML = `
            <span class="upload-zone-icon">✅</span>
            <p><strong>${file.name}</strong></p>
            <span style="font-size: 12px; color: var(--purple-main);">${Hub.formatBytes(file.size)}</span>
        `;
    },

    async renderResults(data) {
        const resultBox = document.getElementById("transcribe-result-box");
        resultBox.style.display = "block";

        // Preenche métricas
        document.getElementById("res-language").textContent = (data.detected_language || "").toUpperCase();
        document.getElementById("res-confidence").textContent = `${Math.round((data.language_probability || 0) * 100)}%`;
        document.getElementById("res-duration").textContent = `${Math.round(data.duration || 0)}s`;
        document.getElementById("res-device").textContent = (data.device_used || "CPU").toUpperCase();
        document.getElementById("res-segments-count").textContent = `${data.segments_count || 0}`;

        // Texto completo
        document.getElementById("transcribe-text-output").value = data.full_text || "";

        // Busca o SRT do arquivo gerado para preencher a aba de visualização
        if (data.urls && data.urls.srt_url) {
            try {
                const srtRes = await fetch(`${Hub.apiBase}${data.urls.srt_url}`);
                const srtText = await srtRes.text();
                document.getElementById("transcribe-srt-output").value = srtText;
            } catch (e) {
                document.getElementById("transcribe-srt-output").value = "Prévia de legenda indisponível.";
            }
        }

        // Renderiza lista de segmentos
        const segmentsContainer = document.getElementById("transcribe-segments-list");
        segmentsContainer.innerHTML = "";
        if (data.segments && data.segments.length > 0) {
            data.segments.forEach(seg => {
                const item = document.createElement("div");
                item.className = "segment-card";
                item.innerHTML = `
                    <div class="segment-timestamp">[${this.formatSeconds(seg.start)} ➔ ${this.formatSeconds(seg.end)}]</div>
                    <div class="segment-text">${seg.text}</div>
                `;
                segmentsContainer.appendChild(item);
            });
        }

        // Links de Download
        const urls = data.urls || {};
        document.getElementById("btn-dl-txt").href = `${Hub.apiBase}${urls.txt_url || '#'}`;
        document.getElementById("btn-dl-srt").href = `${Hub.apiBase}${urls.srt_url || '#'}`;
        document.getElementById("btn-dl-vtt").href = `${Hub.apiBase}${urls.vtt_url || '#'}`;
        document.getElementById("btn-dl-json").href = `${Hub.apiBase}${urls.json_url || '#'}`;
        document.getElementById("btn-dl-zip").href = `${Hub.apiBase}${urls.zip_url || '#'}`;

        resultBox.scrollIntoView({ behavior: "smooth" });
    },

    formatSeconds(seconds) {
        const secs = Math.floor(seconds);
        const mins = Math.floor(secs / 60);
        const remSecs = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    }
});
