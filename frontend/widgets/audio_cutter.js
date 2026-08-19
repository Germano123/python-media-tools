// Widget: Cortador de Áudio & Downloader do YouTube
Hub.registerWidget({
    id: "audio-cutter",
    name: "Cortador de Áudio",
    icon: "✂️",
    description: "Baixe áudios do YouTube ou envie arquivos e realize cortes automáticos baseados em capítulos.",
    
    init(container) {
        container.innerHTML = `
            <div class="widget-section">
                <!-- Seção 1: Obter Áudio -->
                <h3 style="margin-bottom: 15px; color: var(--purple-main)">1. Selecionar ou Baixar Áudio</h3>
                
                <div class="form-row">
                    <!-- Opção A: Download do YouTube -->
                    <div class="form-group" style="border-right: 1px solid var(--border-color); padding-right: 20px;">
                        <label>Baixar do YouTube</label>
                        <input type="url" id="yt-url" placeholder="https://www.youtube.com/watch?v=..." style="margin-bottom: 10px;">
                        <input type="text" id="yt-name" placeholder="Nome do arquivo final (ex: minha_musica)" style="margin-bottom: 10px;">
                        <button class="btn btn-secondary" id="btn-yt-download" style="width: 100%;">
                            <span>⬇️</span> Baixar Áudio
                        </button>
                    </div>

                    <!-- Opção B: Upload Local -->
                    <div class="form-group">
                        <label>Enviar Arquivo de Áudio/Vídeo (.mp3, .mp4)</label>
                        <div class="upload-zone" id="audio-upload-zone">
                            <span class="upload-zone-icon">🎵</span>
                            <p>Arraste um áudio ou <strong>clique aqui</strong></p>
                            <input type="file" id="audio-file-input" accept=".mp3,.mp4" style="display: none;">
                        </div>
                    </div>
                </div>

                <!-- Lista de Seleção do Arquivo Ativo -->
                <div class="form-group" style="margin-top: 20px;">
                    <label for="select-active-audio">Áudio Selecionado para Corte</label>
                    <select id="select-active-audio">
                        <option value="">-- Carregando arquivos de inputs/ --</option>
                    </select>
                </div>

                <hr style="border: none; border-top: 1px solid var(--border-color); margin: 30px 0;">

                <!-- Seção 2: Definir Capítulos / Cortes -->
                <h3 style="margin-bottom: 15px; color: var(--purple-main)">2. Configurar Capítulos para Corte</h3>
                
                <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                    <button class="btn btn-secondary" id="btn-add-chapter">➕ Adicionar Linha</button>
                    <button class="btn btn-secondary" id="btn-import-csv">📄 Importar CSV de Cortes</button>
                    <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
                </div>

                <!-- Tabela de Capítulos -->
                <div class="chapters-table-container">
                    <table class="chapters-table" id="chapters-table">
                        <thead>
                            <tr>
                                <th style="width: 100px;">Tempo</th>
                                <th>Nome do Capítulo/Faixa</th>
                                <th style="width: 80px; text-align: center;">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="chapters-tbody">
                            <!-- Inicia com uma linha vazia padrão -->
                            <tr>
                                <td><input type="text" class="chapter-time" placeholder="00:00" value="00:00" style="width: 100%"></td>
                                <td><input type="text" class="chapter-name" placeholder="Início" value="Introdução" style="width: 100%"></td>
                                <td style="text-align: center;"><button class="btn-danger file-btn btn-remove-row">❌</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Progresso e Ação -->
                <div class="progress-container" id="cutter-progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" id="cutter-progress-bar"></div>
                    </div>
                    <div class="progress-status">
                        <span id="cutter-status-text">Processando...</span>
                    </div>
                </div>

                <div class="result-box" id="cutter-result-box">
                    <div class="result-title">✅ Processamento Concluído!</div>
                    <div class="result-content" id="cutter-result-content"></div>
                    <a href="#" class="btn btn-primary" id="btn-download-zip" target="_blank">⬇️ Baixar Todos os Cortes (ZIP)</a>
                </div>

                <div class="result-box error-box" id="cutter-error-box">
                    <div class="result-title">❌ Erro no Processamento</div>
                    <div class="result-content" id="cutter-error-content"></div>
                </div>

                <button class="btn btn-primary" id="btn-start-cut" style="margin-top: 30px; width: 100%; font-size: 16px; padding: 15px;">
                    ✂️ Iniciar Processo de Corte
                </button>
            </div>
        `;

        this.bindEvents();
        this.loadAudioList();
    },

    // Buscar a lista de áudios disponíveis na pasta inputs
    async loadAudioList() {
        const select = document.getElementById("select-active-audio");
        try {
            const res = await fetch(`${Hub.apiBase}/api/inputs?type=audio`);
            const files = await res.json();
            
            select.innerHTML = '<option value="">-- Selecione um arquivo para cortar --</option>';
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
        const selectActiveAudio = document.getElementById("select-active-audio");
        const btnYtDownload = document.getElementById("btn-yt-download");
        const ytUrlInput = document.getElementById("yt-url");
        const ytNameInput = document.getElementById("yt-name");

        const uploadZone = document.getElementById("audio-upload-zone");
        const fileInput = document.getElementById("audio-file-input");

        const btnAddChapter = document.getElementById("btn-add-chapter");
        const btnImportCsv = document.getElementById("btn-import-csv");
        const csvFileInput = document.getElementById("csv-file-input");
        const chaptersTbody = document.getElementById("chapters-tbody");

        const btnStartCut = document.getElementById("btn-start-cut");
        const progressContainer = document.getElementById("cutter-progress-container");
        const progressBar = document.getElementById("cutter-progress-bar");
        const statusText = document.getElementById("cutter-status-text");
        
        const resultBox = document.getElementById("cutter-result-box");
        const resultContent = document.getElementById("cutter-result-content");
        const btnDownloadZip = document.getElementById("btn-download-zip");

        const errorBox = document.getElementById("cutter-error-box");
        const errorContent = document.getElementById("cutter-error-content");

        // 1. Download do YouTube
        btnYtDownload.addEventListener("click", async () => {
            const url = ytUrlInput.value.trim();
            const filename = ytNameInput.value.trim();

            if (!url || !filename) {
                alert("Por favor, preencha a URL do YouTube e o nome do arquivo final.");
                return;
            }

            btnYtDownload.disabled = true;
            btnYtDownload.textContent = "Baixando e convertendo...";

            try {
                const response = await fetch(`${Hub.apiBase}/api/audio-cutter/download`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url, filename })
                });

                const result = await response.json();
                if (result.error) {
                    alert(`Erro: ${result.error}`);
                } else {
                    alert("Download finalizado com sucesso!");
                    await this.loadAudioList();
                    selectActiveAudio.value = result.filename;
                }
            } catch (e) {
                alert("Ocorreu um erro ao baixar do YouTube.");
            } finally {
                btnYtDownload.disabled = false;
                btnYtDownload.innerHTML = "<span>⬇️</span> Baixar Áudio";
            }
        });

        // 2. Upload de Arquivos
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
                this.uploadAudioFile(fileInput.files[0]);
            }
        });

        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                this.uploadAudioFile(fileInput.files[0]);
            }
        });

        // 3. Adicionar Linha de Capítulo
        btnAddChapter.addEventListener("click", () => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="text" class="chapter-time" placeholder="00:00" style="width: 100%"></td>
                <td><input type="text" class="chapter-name" placeholder="Novo Capítulo" style="width: 100%"></td>
                <td style="text-align: center;"><button class="btn-danger file-btn btn-remove-row">❌</button></td>
            `;
            chaptersTbody.appendChild(tr);
        });

        // Remover Linha
        chaptersTbody.addEventListener("click", (e) => {
            if (e.target.classList.contains("btn-remove-row")) {
                const tr = e.target.closest("tr");
                tr.remove();
            }
        });

        // 4. Importar CSV
        btnImportCsv.addEventListener("click", () => csvFileInput.click());
        csvFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const text = evt.target.result;
                this.parseCSVChapters(text);
            };
            reader.readAsText(file);
        });

        // 5. Iniciar Cortes
        btnStartCut.addEventListener("click", async () => {
            const activeAudio = selectActiveAudio.value;
            if (!activeAudio) {
                alert("Selecione um arquivo de áudio para cortar.");
                return;
            }

            // Coleta os capítulos da tabela
            const rows = chaptersTbody.querySelectorAll("tr");
            const chapters = [];

            rows.forEach(row => {
                const time = row.querySelector(".chapter-time").value.trim();
                const name = row.querySelector(".chapter-name").value.trim();
                if (time && name) {
                    chapters.push({ name, start: time });
                }
            });

            if (chapters.length === 0) {
                alert("Insira pelo menos um capítulo para corte.");
                return;
            }

            // Iniciar UI de processamento
            resultBox.style.display = "none";
            errorBox.style.display = "none";
            progressContainer.style.display = "block";
            progressBar.style.width = "40%";
            statusText.textContent = "Cortando arquivos e criando ZIP...";
            btnStartCut.disabled = true;

            try {
                const response = await fetch(`${Hub.apiBase}/api/audio-cutter/cut`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        audio_file: activeAudio,
                        chapters: chapters
                    })
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
                        O áudio foi cortado com sucesso em <strong>${result.files.length} faixas</strong>.<br>
                        Grave seu arquivo compactado no botão abaixo.
                    `;
                    btnDownloadZip.href = `${Hub.apiBase}${result.zip_url}`;
                }
            } catch (e) {
                progressContainer.style.display = "none";
                errorBox.style.display = "block";
                errorContent.textContent = "Erro na requisição para o servidor.";
            } finally {
                btnStartCut.disabled = false;
            }
        });
    },

    // Enviar arquivo de áudio local
    async uploadAudioFile(file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("target", "inputs");

        const uploadZone = document.getElementById("audio-upload-zone");
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
                alert("Upload concluído com sucesso!");
                await this.loadAudioList();
                document.getElementById("select-active-audio").value = result.filename;
            }
        } catch (e) {
            alert("Erro ao enviar arquivo para o servidor.");
        } finally {
            uploadZone.innerHTML = originalText;
        }
    },

    // Fazer o parse de CSV e preencher a tabela
    parseCSVChapters(csvText) {
        const lines = csvText.split("\n");
        const chaptersTbody = document.getElementById("chapters-tbody");
        chaptersTbody.innerHTML = ""; // Limpa a tabela

        let hasData = false;

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            // Suporta CSV simples: tempo,nome ou nome,tempo ou headers
            // Ignorar cabeçalho se houver
            if (line.toLowerCase().includes("time") || line.toLowerCase().includes("name") || line.toLowerCase().includes("tempo")) {
                return;
            }

            const parts = line.split(",");
            if (parts.length >= 2) {
                let time = parts[0].trim();
                let name = parts[1].trim();

                // Se o tempo tiver cara de tempo (contém ':')
                // Se a ordem for invertida (nome primeiro, depois tempo)
                if (!time.includes(":") && name.includes(":")) {
                    const temp = time;
                    time = name;
                    name = temp;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><input type="text" class="chapter-time" placeholder="00:00" value="${time}" style="width: 100%"></td>
                    <td><input type="text" class="chapter-name" placeholder="Nome" value="${name}" style="width: 100%"></td>
                    <td style="text-align: center;"><button class="btn-danger file-btn btn-remove-row">❌</button></td>
                `;
                chaptersTbody.appendChild(tr);
                hasData = true;
            }
        });

        if (!hasData) {
            alert("Nenhum capítulo válido encontrado no CSV. Use o formato: tempo,nome");
            // Adiciona uma linha vazia padrão
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><input type="text" class="chapter-time" placeholder="00:00" value="00:00" style="width: 100%"></td>
                <td><input type="text" class="chapter-name" placeholder="Início" value="Introdução" style="width: 100%"></td>
                <td style="text-align: center;"><button class="btn-danger file-btn btn-remove-row">❌</button></td>
            `;
            chaptersTbody.appendChild(tr);
        }
    }
});
