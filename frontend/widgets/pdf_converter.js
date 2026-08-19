// Widget: Conversor de Imagens para PDF
Hub.registerWidget({
    id: "pdf-converter",
    name: "Imagens para PDF",
    icon: "📄",
    description: "Converta e junte múltiplas imagens (PNG, JPG, etc.) em um único arquivo PDF ordenado.",
    
    // Lista local de imagens para converter
    imagesToConvert: [],

    init(container) {
        this.imagesToConvert = [];
        
        container.innerHTML = `
            <div class="widget-section">
                <!-- Zona de Upload de Múltiplas Imagens -->
                <div class="form-group">
                    <label>Adicionar Imagens para o PDF</label>
                    <div class="upload-zone" id="pdf-upload-zone">
                        <span class="upload-zone-icon">🖼️</span>
                        <p>Arraste múltiplas imagens ou <strong>clique aqui</strong> para adicionar</p>
                        <input type="file" id="pdf-files-input" accept=".png,.jpg,.jpeg,.webp,.bmp,.tiff" multiple style="display: none;">
                    </div>
                </div>

                <!-- Lista de Imagens Carregadas / Ordenação -->
                <div class="form-group">
                    <label>Ordem das Páginas (a primeira imagem será a página 1)</label>
                    <div id="pdf-empty-list" style="padding: 20px; text-align: center; color: var(--text-muted); background: var(--bg-input); border-radius: 8px; border: 1px solid var(--border-color);">
                        Nenhuma imagem adicionada ainda. Adicione imagens acima para ordenar as páginas do PDF.
                    </div>
                    <ul class="file-list" id="pdf-file-list" style="display: none;">
                        <!-- Itens das imagens serão injetados dinamicamente aqui -->
                    </ul>
                </div>

                <!-- Barra de Progresso -->
                <div class="progress-container" id="pdf-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="pdf-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="pdf-status-text">Gerando arquivo PDF...</span>
                    </div>
                </div>

                <!-- Resultados -->
                <div class="result-box" id="pdf-result-box">
                    <div class="result-title">✅ PDF Gerado com Sucesso!</div>
                    <div class="result-content" id="pdf-result-content"></div>
                    <a href="#" class="btn btn-primary" id="pdf-btn-download" target="_blank">⬇️ Baixar PDF</a>
                </div>

                <div class="result-box error-box" id="pdf-error-box">
                    <div class="result-title">❌ Erro ao Gerar PDF</div>
                    <div class="result-content" id="pdf-error-content"></div>
                </div>

                <button class="btn btn-primary" id="pdf-btn-submit" style="margin-top: 20px; width: 100%; font-size: 16px; padding: 15px;" disabled>
                    📄 Gerar PDF
                </button>
            </div>
        `;

        this.bindEvents();
    },

    bindEvents() {
        const uploadZone = document.getElementById("pdf-upload-zone");
        const filesInput = document.getElementById("pdf-files-input");
        const btnSubmit = document.getElementById("pdf-btn-submit");

        const progressContainer = document.getElementById("pdf-progress-container");
        const progressBar = document.getElementById("pdf-progress-bar");
        const statusText = document.getElementById("pdf-status-text");

        const resultBox = document.getElementById("pdf-result-box");
        const resultContent = document.getElementById("pdf-result-content");
        const btnDownload = document.getElementById("pdf-btn-download");

        const errorBox = document.getElementById("pdf-error-box");
        const errorContent = document.getElementById("pdf-error-content");

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
            if (this.imagesToConvert.length === 0) {
                alert("Adicione pelo menos 1 imagem.");
                return;
            }

            resultBox.style.display = "none";
            errorBox.style.display = "none";
            progressContainer.style.display = "block";
            progressBar.style.width = "50%";
            statusText.textContent = "Convertendo imagens e gerando PDF com o Pillow...";
            btnSubmit.disabled = true;

            const formData = new FormData();
            this.imagesToConvert.forEach(file => {
                formData.append("files", file);
            });

            try {
                const response = await fetch(`${Hub.apiBase}/api/pdf-converter/convert`, {
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
                        Seu arquivo PDF com <strong>${this.imagesToConvert.length} página(s)</strong> foi gerado com sucesso!
                    `;
                    btnDownload.href = `${Hub.apiBase}${result.pdf_url}`;
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
        // Ordena nativamente pelo número no nome se for carregado em lote
        const tempArr = [];
        for (let i = 0; i < fileList.length; i++) {
            tempArr.push(fileList[i]);
        }
        
        // Ordenação inteligente: tenta encontrar números no nome e ordenar por eles
        tempArr.sort((a, b) => {
            const numA = parseInt(a.name.replace(/\D/g, ''));
            const numB = parseInt(b.name.replace(/\D/g, ''));
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return a.name.localeCompare(b.name);
        });

        tempArr.forEach(file => this.imagesToConvert.push(file));
        this.renderFileList();
    },

    removeFile(index) {
        this.imagesToConvert.splice(index, 1);
        this.renderFileList();
    },

    moveFile(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.imagesToConvert.length) return;
        
        // Swap
        const temp = this.imagesToConvert[index];
        this.imagesToConvert[index] = this.imagesToConvert[newIndex];
        this.imagesToConvert[newIndex] = temp;
        
        this.renderFileList();
    },

    updateSubmitButtonState() {
        const btnSubmit = document.getElementById("pdf-btn-submit");
        if (btnSubmit) {
            btnSubmit.disabled = this.imagesToConvert.length === 0;
        }
    },

    renderFileList() {
        const emptyList = document.getElementById("pdf-empty-list");
        const listEl = document.getElementById("pdf-file-list");

        if (this.imagesToConvert.length === 0) {
            emptyList.style.display = "block";
            listEl.style.display = "none";
        } else {
            emptyList.style.display = "none";
            listEl.style.display = "flex";
            listEl.innerHTML = "";

            this.imagesToConvert.forEach((file, index) => {
                const li = document.createElement("li");
                li.className = "file-item";
                li.innerHTML = `
                    <div class="file-item-info">
                        <span style="font-size: 16px;">🖼️</span>
                        <div>
                            <strong>Pág ${index + 1}: ${file.name}</strong>
                            <div style="font-size: 11px; color: var(--text-muted);">${Hub.formatBytes(file.size)}</div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="file-btn btn-up" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button class="file-btn btn-down" ${index === this.imagesToConvert.length - 1 ? 'disabled' : ''}>▼</button>
                        <button class="file-btn btn-remove" style="color: var(--danger);">❌</button>
                    </div>
                `;

                li.querySelector(".btn-up").addEventListener("click", () => this.moveFile(index, -1));
                li.querySelector(".btn-down").addEventListener("click", () => this.moveFile(index, 1));
                li.querySelector(".btn-remove").addEventListener("click", () => this.removeFile(index));

                listEl.appendChild(li);
            });
        }

        this.updateSubmitButtonState();
    }
});
