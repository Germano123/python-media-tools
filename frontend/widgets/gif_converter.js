// Widget: Conversor de Vídeo para GIF
Hub.registerWidget({
    id: "gif-converter",
    name: "Vídeo para GIF",
    icon: "🎞️",
    description: "Converta trechos de vídeos em GIFs animados com controle de resolução, FPS e tempo.",
    
    init(container) {
        container.innerHTML = `
            <div class="widget-section">
                <!-- Upload/Seleção de Vídeo -->
                <div class="form-group">
                    <label>Selecionar Vídeo</label>
                    <div class="upload-zone" id="gif-upload-zone">
                        <span class="upload-zone-icon">📹</span>
                        <p>Arraste um vídeo ou <strong>clique aqui</strong> para enviar</p>
                        <input type="file" id="gif-file-input" accept=".mp4,.mov,.avi,.mkv,.webm" style="display: none;">
                    </div>
                </div>

                <div class="form-group">
                    <label for="gif-select-active">Ou selecione um vídeo já existente</label>
                    <select id="gif-select-active">
                        <option value="">-- Carregando arquivos de inputs/ --</option>
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="gif-fps">Quadros por Segundo (FPS)</label>
                        <input type="number" id="gif-fps" min="1" max="30" value="10">
                    </div>
                    <div class="form-group">
                        <label for="gif-start">Tempo de Início (segundos)</label>
                        <input type="number" id="gif-start" min="0" value="0">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="gif-duration">Duração (segundos - opcional)</label>
                        <input type="number" id="gif-duration" min="0" placeholder="Converter vídeo todo">
                    </div>
                    <div class="form-group">
                        <label for="gif-width">Largura (pixels - opcional)</label>
                        <input type="number" id="gif-width" min="100" max="1920" value="640" placeholder="Largura original">
                    </div>
                </div>

                <!-- Progresso -->
                <div class="progress-container" id="gif-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="gif-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="gif-status-text">Processando vídeo...</span>
                    </div>
                </div>

                <!-- Resultados -->
                <div class="result-box" id="gif-result-box" style="text-align: center;">
                    <div class="result-title" style="justify-content: center;">✅ GIF Criado com Sucesso!</div>
                    <div style="margin: 20px 0;">
                        <img id="gif-preview" src="" alt="GIF Preview" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
                    </div>
                    <a href="#" class="btn btn-primary" id="gif-btn-download" target="_blank">⬇️ Baixar GIF</a>
                </div>

                <div class="result-box error-box" id="gif-error-box">
                    <div class="result-title">❌ Erro na Conversão</div>
                    <div class="result-content" id="gif-error-content"></div>
                </div>

                <button class="btn btn-primary" id="gif-btn-submit" style="margin-top: 20px; width: 100%; font-size: 16px; padding: 15px;">
                    🎞️ Gerar GIF
                </button>
            </div>
        `;

        this.bindEvents();
        this.loadVideoList();
    },

    async loadVideoList() {
        const select = document.getElementById("gif-select-active");
        try {
            const res = await fetch(`${Hub.apiBase}/api/inputs?type=video`);
            const files = await res.json();
            
            select.innerHTML = '<option value="">-- Ou selecione da pasta inputs/ --</option>';
            files.forEach(file => {
                const opt = document.createElement("option");
                opt.value = file.name;
                opt.textContent = `${file.name} (${Hub.formatBytes(file.size)})`;
                select.appendChild(opt);
            });
        } catch (e) {
            select.innerHTML = '<option value="">Erro ao carregar arquivos</option>';
        }
    },

    bindEvents() {
        const uploadZone = document.getElementById("gif-upload-zone");
        const fileInput = document.getElementById("gif-file-input");
        const selectActive = document.getElementById("gif-select-active");
        const btnSubmit = document.getElementById("gif-btn-submit");

        const progressContainer = document.getElementById("gif-progress-container");
        const progressBar = document.getElementById("gif-progress-bar");
        const statusText = document.getElementById("gif-status-text");

        const resultBox = document.getElementById("gif-result-box");
        const gifPreview = document.getElementById("gif-preview");
        const btnDownload = document.getElementById("gif-btn-download");

        const errorBox = document.getElementById("gif-error-box");
        const errorContent = document.getElementById("gif-error-content");

        // Drag and Drop
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
                fileInput.files = e.dataTransfer.files;
                this.uploadVideoFile(fileInput.files[0]);
            }
        });
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                this.uploadVideoFile(fileInput.files[0]);
            }
        });

        // Submit de Conversão
        btnSubmit.addEventListener("click", async () => {
            const activeVideo = selectActive.value;
            const hasLocalUpload = fileInput.files.length > 0;

            if (!activeVideo && !hasLocalUpload) {
                alert("Selecione um arquivo de vídeo ou faça upload de um.");
                return;
            }

            const fps = document.getElementById("gif-fps").value;
            const startTime = document.getElementById("gif-start").value;
            const duration = document.getElementById("gif-duration").value;
            const resizeWidth = document.getElementById("gif-width").value;

            resultBox.style.display = "none";
            errorBox.style.display = "none";
            progressContainer.style.display = "block";
            progressBar.style.width = "50%";
            statusText.textContent = "Convertendo quadros do vídeo...";
            btnSubmit.disabled = true;

            try {
                let response;
                // Se foi selecionado da lista de inputs preexistente, faz POST JSON
                if (activeVideo && !hasLocalUpload) {
                    response = await fetch(`${Hub.apiBase}/api/gif-converter/convert`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            video_file: activeVideo,
                            fps: parseInt(fps),
                            start_time: parseFloat(startTime),
                            duration: duration ? parseFloat(duration) : 0,
                            resize_width: resizeWidth ? parseInt(resizeWidth) : 0
                        })
                    });
                } else {
                    // Se fez upload na hora, envia FormData multipart
                    const formData = new FormData();
                    formData.append("file", fileInput.files[0]);
                    formData.append("fps", fps);
                    formData.append("start_time", startTime);
                    if (duration) formData.append("duration", duration);
                    if (resizeWidth) formData.append("resize_width", resizeWidth);

                    response = await fetch(`${Hub.apiBase}/api/gif-converter/convert`, {
                        method: "POST",
                        body: formData
                    });
                }

                const result = await response.json();
                progressBar.style.width = "100%";

                if (result.error) {
                    progressContainer.style.display = "none";
                    errorBox.style.display = "block";
                    errorContent.textContent = result.error;
                } else {
                    progressContainer.style.display = "none";
                    resultBox.style.display = "block";
                    
                    const fullGifUrl = `${Hub.apiBase}${result.gif_url}`;
                    gifPreview.src = fullGifUrl;
                    btnDownload.href = fullGifUrl;
                }
            } catch (e) {
                progressContainer.style.display = "none";
                errorBox.style.display = "block";
                errorContent.textContent = "Erro de conexão com o servidor.";
            } finally {
                btnSubmit.disabled = false;
            }
        });
    },

    async uploadVideoFile(file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("target", "inputs");

        const uploadZone = document.getElementById("gif-upload-zone");
        const originalText = uploadZone.innerHTML;
        uploadZone.innerHTML = `
            <span class="upload-zone-icon">⏳</span>
            <p>Enviando <strong>${file.name}</strong>...</p>
        `;

        try {
            const res = await fetch(`${Hub.apiBase}/api/upload`, {
                method: "POST",
                body: formData
            });

            const result = await res.json();
            if (result.error) {
                alert(`Erro no upload: ${result.error}`);
            } else {
                alert("Upload de vídeo concluído!");
                await this.loadVideoList();
                document.getElementById("gif-select-active").value = result.filename;
            }
        } catch (e) {
            alert("Erro ao enviar vídeo para o servidor.");
        } finally {
            uploadZone.innerHTML = originalText;
        }
    }
});
