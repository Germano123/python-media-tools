// Widget: União (Merge) de Vídeos
Hub.registerWidget({
    id: "video-merger",
    name: "Mesclar Vídeos",
    icon: "🔌",
    description: "Junte múltiplos arquivos de vídeo em um único vídeo final mantendo a ordem que escolher.",
    
    // Lista local de arquivos para mesclar
    filesToMerge: [],

    init(container) {
        this.filesToMerge = [];
        
        container.innerHTML = `
            <div class="widget-section">
                <!-- Zona de Upload de Múltiplos Arquivos -->
                <div class="form-group">
                    <label>Adicionar Vídeos para União</label>
                    <div class="upload-zone" id="merge-upload-zone">
                        <span class="upload-zone-icon">🎞️</span>
                        <p>Arraste múltiplos vídeos ou <strong>clique aqui</strong> para adicionar</p>
                        <input type="file" id="merge-files-input" accept=".mp4,.mov,.avi,.mkv,.webm" multiple style="display: none;">
                    </div>
                </div>

                <!-- Lista de Vídeos Carregados / Ordenação -->
                <div class="form-group">
                    <label>Ordem dos Vídeos (o vídeo do topo será o primeiro)</label>
                    <div id="merge-empty-list" style="padding: 20px; text-align: center; color: var(--text-muted); background: var(--bg-input); border-radius: 8px; border: 1px solid var(--border-color);">
                        Nenhum vídeo adicionado ainda. Adicione vídeos acima para ordenar.
                    </div>
                    <ul class="file-list" id="merge-file-list" style="display: none;">
                        <!-- Itens do vídeo serão injetados dinamicamente aqui -->
                    </ul>
                </div>

                <!-- Barra de Progresso -->
                <div class="progress-container" id="merge-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="merge-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="merge-status-text">Mesclando vídeos... Isso pode levar alguns minutos dependendo do tamanho.</span>
                    </div>
                </div>

                <!-- Resultados -->
                <div class="result-box" id="merge-result-box">
                    <div class="result-title">✅ Vídeos Mesclados com Sucesso!</div>
                    <div class="result-content" id="merge-result-content"></div>
                    <a href="#" class="btn btn-primary" id="merge-btn-download" target="_blank">⬇️ Baixar Vídeo Mesclado</a>
                </div>

                <div class="result-box error-box" id="merge-error-box">
                    <div class="result-title">❌ Erro ao Mesclar</div>
                    <div class="result-content" id="merge-error-content"></div>
                </div>

                <button class="btn btn-primary" id="merge-btn-submit" style="margin-top: 20px; width: 100%; font-size: 16px; padding: 15px;" disabled>
                    🔌 Iniciar Junção de Vídeos
                </button>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const uploadZone = document.getElementById("merge-upload-zone");
        const filesInput = document.getElementById("merge-files-input");
        const btnSubmit = document.getElementById("merge-btn-submit");

        const progressContainer = document.getElementById("merge-progress-container");
        const progressBar = document.getElementById("merge-progress-bar");
        const statusText = document.getElementById("merge-status-text");

        const resultBox = document.getElementById("merge-result-box");
        const resultContent = document.getElementById("merge-result-content");
        const btnDownload = document.getElementById("merge-btn-download");

        const errorBox = document.getElementById("merge-error-box");
        const errorContent = document.getElementById("merge-error-content");

        // Drag and drop
        uploadZone.addEventListener("click", () => filesInput.click());
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
                this.addFilesToList(e.dataTransfer.files);
            }
        });
        filesInput.addEventListener("change", () => {
            if (filesInput.files.length > 0) {
                this.addFilesToList(filesInput.files);
            }
        });

        // Submit
        btnSubmit.addEventListener("click", async () => {
            if (this.filesToMerge.length < 2) {
                alert("Adicione pelo menos 2 vídeos para mesclar.");
                return;
            }

            resultBox.style.display = "none";
            errorBox.style.display = "none";
            progressContainer.style.display = "block";
            progressBar.style.width = "40%";
            statusText.textContent = "Carregando e processando clips de vídeo via MoviePy (ffmpeg)...";
            btnSubmit.disabled = true;

            const formData = new FormData();
            this.filesToMerge.forEach(file => {
                formData.append("files", file);
            });

            try {
                const response = await fetch(`${Hub.apiBase}/api/video-merger/merge`, {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                progressBar.style.width = "100%";

                if (result.error) {
                    progressContainer.style.display = "none";
                    errorBox.style.display = "block";
                    errorContent.textContent = result.error;
                } else {
                    progressContainer.style.display = "none";
                    resultBox.style.display = "block";
                    resultContent.innerHTML = `
                        Seus vídeos foram mesclados em um único arquivo mp4 com sucesso!
                    `;
                    btnDownload.href = `${Hub.apiBase}${result.video_url}`;
                }
            } catch (e) {
                progressContainer.style.display = "none";
                errorBox.style.display = "block";
                errorContent.textContent = "Erro de conexão com o servidor backend.";
            } finally {
                btnSubmit.disabled = false;
                this.updateSubmitButtonState();
            }
        });
    },

    addFilesToList(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            this.filesToMerge.push(fileList[i]);
        }
        this.renderFileList();
    },

    removeFile(index) {
        this.filesToMerge.splice(index, 1);
        this.renderFileList();
    },

    moveFile(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.filesToMerge.length) return;
        
        // Swap
        const temp = this.filesToMerge[index];
        this.filesToMerge[index] = this.filesToMerge[newIndex];
        this.filesToMerge[newIndex] = temp;
        
        this.renderFileList();
    },

    updateSubmitButtonState() {
        const btnSubmit = document.getElementById("merge-btn-submit");
        if (btnSubmit) {
            btnSubmit.disabled = this.filesToMerge.length < 2;
        }
    },

    renderFileList() {
        const emptyList = document.getElementById("merge-empty-list");
        const listEl = document.getElementById("merge-file-list");

        if (this.filesToMerge.length === 0) {
            emptyList.style.display = "block";
            listEl.style.display = "none";
        } else {
            emptyList.style.display = "none";
            listEl.style.display = "flex";
            listEl.innerHTML = "";

            this.filesToMerge.forEach((file, index) => {
                const li = document.createElement("li");
                li.className = "file-item";
                li.innerHTML = `
                    <div class="file-item-info">
                        <span style="font-size: 16px;">🎬</span>
                        <div>
                            <strong>${file.name}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${Hub.formatBytes(file.size)}</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="file-btn btn-up" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button class="file-btn btn-down" ${index === this.filesToMerge.length - 1 ? 'disabled' : ''}>▼</button>
                        <button class="file-btn btn-remove" style="color: var(--danger);">❌</button>
                    </div>
                `;

                // Eventos dos botões de ação
                li.querySelector(".btn-up").addEventListener("click", () => this.moveFile(index, -1));
                li.querySelector(".btn-down").addEventListener("click", () => this.moveFile(index, 1));
                li.querySelector(".btn-remove").addEventListener("click", () => this.removeFile(index));

                listEl.appendChild(li);
            });
        }

        this.updateSubmitButtonState();
    }
});
