// Widget: Downloader de Vídeos do YouTube (Suporta Vídeo Único ou Playlist)
Hub.registerWidget({
    id: "video-downloader",
    name: "Downloader de Vídeos",
    icon: "📥",
    description: "Baixe vídeos individuais ou playlists completas do YouTube diretamente para seu computador.",
    
    // Armazena as informações analisadas
    analyzedInfo: null,

    init(container) {
        this.analyzedInfo = null;
        
        container.innerHTML = `
            <div class="widget-section">
                <!-- Entrada de URL -->
                <div class="form-group">
                    <label for="downloader-url">URL do Vídeo ou Playlist do YouTube</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="url" id="downloader-url" placeholder="https://www.youtube.com/watch?v=... ou https://www.youtube.com/playlist?list=..." style="flex-grow: 1;">
                        <button class="btn btn-primary" id="downloader-btn-analyze">Analisar Link</button>
                    </div>
                </div>

                <!-- Carregamento da Análise -->
                <div class="progress-container" id="downloader-analyze-loading" style="margin-top: 15px;">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: 70%; animation: pulse 1.5s infinite;"></div>
                    </div>
                    <div class="progress-status">
                        <span>Analisando a URL do YouTube... Buscando metadados de playlists...</span>
                    </div>
                </div>

                <!-- Painel de Resultados da Análise (Injetado dinamicamente) -->
                <div id="downloader-analysis-result" style="margin-top: 25px; display: none;"></div>

                <!-- Barra de Progresso do Download -->
                <div class="progress-container" id="downloader-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="downloader-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="downloader-status-text">Iniciando download...</span>
                    </div>
                </div>

                <!-- Resultados Finais do Download -->
                <div class="result-box" id="downloader-result-box">
                    <div class="result-title">✅ Downloads Concluídos!</div>
                    <div class="result-content" id="downloader-result-content"></div>
                </div>

                <div class="result-box error-box" id="downloader-error-box">
                    <div class="result-title">❌ Erro no Processamento</div>
                    <div class="result-content" id="downloader-error-content"></div>
                </div>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const btnAnalyze = document.getElementById("downloader-btn-analyze");
        const urlInput = document.getElementById("downloader-url");
        const loadingAnalyze = document.getElementById("downloader-analyze-loading");
        const analysisResultPanel = document.getElementById("downloader-analysis-result");
        
        const progressContainer = document.getElementById("downloader-progress-container");
        const progressBar = document.getElementById("downloader-progress-bar");
        const statusText = document.getElementById("downloader-status-text");

        const resultBox = document.getElementById("downloader-result-box");
        const resultContent = document.getElementById("downloader-result-content");
        const errorBox = document.getElementById("downloader-error-box");
        const errorContent = document.getElementById("downloader-error-content");

        // 1. Analisar link
        btnAnalyze.addEventListener("click", async () => {
            const url = urlInput.value.trim();
            if (!url) {
                alert("Insira uma URL do YouTube.");
                return;
            }

            // Reset UI
            analysisResultPanel.style.display = "none";
            analysisResultPanel.innerHTML = "";
            resultBox.style.display = "none";
            errorBox.style.display = "none";
            loadingAnalyze.style.display = "block";
            btnAnalyze.disabled = true;

            try {
                const response = await fetch(`${Hub.apiBase}/api/video-downloader/info`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url })
                });

                const result = await response.json();
                loadingAnalyze.style.display = "none";

                if (result.error) {
                    errorBox.style.display = "block";
                    errorContent.textContent = result.error;
                } else {
                    this.analyzedInfo = result;
                    this.renderAnalysisResult(result, analysisResultPanel);
                }
            } catch (e) {
                loadingAnalyze.style.display = "none";
                errorBox.style.display = "block";
                errorContent.textContent = "Erro ao tentar se comunicar com o servidor.";
            } finally {
                btnAnalyze.disabled = false;
            }
        });
    },

    // Renderizar o resultado da análise de vídeo/playlist
    renderAnalysisResult(info, panelEl) {
        panelEl.style.display = "block";

        if (info.is_playlist) {
            // Caso seja Playlist
            panelEl.innerHTML = `
                <div style="background: var(--purple-light); padding: 15px; border-radius: 8px; border-left: 4px solid var(--purple-main); margin-bottom: 20px;">
                    <strong style="color: var(--purple-main);">Playlist Identificada:</strong> ${info.title}
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Encontrados <strong>${info.videos.length} vídeos</strong>. Selecione quais deseja baixar.</div>
                </div>

                <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                    <button class="btn btn-secondary" id="dl-select-all" style="padding: 6px 12px; font-size: 12px;">Selecionar Todos</button>
                    <button class="btn btn-secondary" id="dl-deselect-all" style="padding: 6px 12px; font-size: 12px;">Desmarcar Todos</button>
                </div>

                <div class="chapters-table-container" style="max-height: 300px; overflow-y: auto;">
                    <table class="chapters-table">
                        <thead>
                            <tr>
                                <th style="width: 50px; text-align: center;">Baixar</th>
                                <th style="width: 50px; text-align: center;">#</th>
                                <th>Título do Vídeo</th>
                            </tr>
                        </thead>
                        <tbody id="dl-playlist-tbody">
                            ${info.videos.map((vid, idx) => `
                                <tr>
                                    <td style="text-align: center;">
                                        <input type="checkbox" class="dl-video-checkbox" value="${vid.url}" checked style="width: 18px; height: 18px; cursor: pointer;">
                                    </td>
                                    <td style="text-align: center; color: var(--text-muted);">${idx + 1}</td>
                                    <td><strong>${vid.title}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <button class="btn btn-primary" id="downloader-btn-start" style="width: 100%; margin-top: 20px; font-size: 16px; padding: 12px;">
                    📥 Baixar Vídeos Selecionados
                </button>
            `;

            // Vincular ações da playlist
            const selectAllBtn = document.getElementById("dl-select-all");
            const deselectAllBtn = document.getElementById("dl-deselect-all");
            const checkboxes = panelEl.querySelectorAll(".dl-video-checkbox");
            
            selectAllBtn.addEventListener("click", () => checkboxes.forEach(cb => cb.checked = true));
            deselectAllBtn.addEventListener("click", () => checkboxes.forEach(cb => cb.checked = false));

            document.getElementById("downloader-btn-start").addEventListener("click", () => {
                const selectedUrls = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) selectedUrls.push(cb.value);
                });
                
                if (selectedUrls.length === 0) {
                    alert("Selecione pelo menos um vídeo para baixar.");
                    return;
                }
                
                this.startDownload(selectedUrls);
            });

        } else {
            // Caso seja Vídeo Único
            panelEl.innerHTML = `
                <div style="background: var(--purple-light); padding: 20px; border-radius: 8px; border-left: 4px solid var(--purple-main); text-align: center; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: var(--purple-main); font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">Vídeo Identificado</div>
                    <h4 style="color: var(--text-dark); font-size: 16px; font-weight: 700;">${info.title}</h4>
                </div>

                <button class="btn btn-primary" id="downloader-btn-start" style="width: 100%; font-size: 16px; padding: 12px;">
                    📥 Baixar Vídeo
                </button>
            `;

            document.getElementById("downloader-btn-start").addEventListener("click", () => {
                this.startDownload([info.url]);
            });
        }
    },

    // Iniciar o download das URLs enviadas
    async startDownload(urls) {
        const progressContainer = document.getElementById("downloader-progress-container");
        const progressBar = document.getElementById("downloader-progress-bar");
        const statusText = document.getElementById("downloader-status-text");

        const resultBox = document.getElementById("downloader-result-box");
        const resultContent = document.getElementById("downloader-result-content");
        const errorBox = document.getElementById("downloader-error-box");

        // UI Reset
        resultBox.style.display = "none";
        errorBox.style.display = "none";
        progressContainer.style.display = "block";
        progressBar.style.width = "20%";
        statusText.textContent = `Iniciando download de ${urls.length} vídeo(s) no servidor...`;
        
        const btnStart = document.getElementById("downloader-btn-start");
        if (btnStart) btnStart.disabled = true;

        try {
            const response = await fetch(`${Hub.apiBase}/api/video-downloader/download`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls })
            });

            const result = await response.json();
            progressBar.style.width = "100%";
            progressContainer.style.display = "none";

            if (result.status === "error") {
                errorBox.style.display = "block";
                document.getElementById("downloader-error-content").innerHTML = `
                    Ocorreu um erro ao baixar os vídeos:<br>
                    ${result.errors.map(err => `• ${err.error}`).join('<br>')}
                `;
            } else {
                resultBox.style.display = "block";
                
                let html = `Foram baixados com sucesso <strong>${result.files.length} arquivo(s)</strong>:<br><br>`;
                html += `<ul style="list-style: none; display: flex; flex-direction: column; gap: 8px;">`;
                result.files.forEach(file => {
                    html += `
                        <li style="display: flex; align-items: center; justify-content: space-between; padding: 10px; background: var(--bg-input); border-radius: 6px; border: 1px solid var(--border-color);">
                            <span style="font-weight: 500;">🎬 ${file.name}</span>
                            <a href="${Hub.apiBase}${file.url}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" download target="_blank">Salvar Arquivo</a>
                        </li>
                    `;
                });
                html += `</ul>`;

                if (result.errors && result.errors.length > 0) {
                    html += `<br><br><span style="color: var(--danger); font-weight: 600;">Falhas ao baixar (${result.errors.length}):</span><br>`;
                    result.errors.forEach(err => {
                        html += `<span style="font-size: 11px; color: var(--text-muted);">• Link: ${err.url} -> Erro: ${err.error}</span><br>`;
                    });
                }

                resultContent.innerHTML = html;
            }

        } catch (e) {
            progressContainer.style.display = "none";
            errorBox.style.display = "block";
            document.getElementById("downloader-error-content").textContent = "Erro ao efetuar download no servidor.";
        } finally {
            if (btnStart) btnStart.disabled = false;
        }
    }
});

// Adiciona uma animação CSS simples de pulso no widget-bar
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
`;
document.head.appendChild(style);
