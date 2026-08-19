// Core do Media Tools HUB
window.Hub = {
    widgets: [],
    activeWidgetId: null,
    apiBase: window.location.protocol === 'file:' ? 'http://localhost:5000' : window.location.origin,

    // Registrar um novo widget autônomo
    registerWidget(widget) {
        this.widgets.push(widget);
        this.renderTabs();
    },

    // Renderizar a lista de abas (tabs) no menu lateral
    renderTabs() {
        const listContainer = document.getElementById("widget-tabs");
        listContainer.innerHTML = "";

        this.widgets.forEach(widget => {
            const li = document.createElement("li");
            li.id = `tab-${widget.id}`;
            li.innerHTML = `
                <span class="tab-icon">${widget.icon || '⚙️'}</span>
                <span class="tab-name">${widget.name}</span>
            `;
            
            li.addEventListener("click", () => this.switchWidget(widget.id));
            listContainer.appendChild(li);
        });

        // Se houver widgets e nenhum ativo, seleciona o primeiro
        if (this.widgets.length > 0 && !this.activeWidgetId) {
            // Pequeno delay para garantir que tudo carregou
            setTimeout(() => {
                this.switchWidget(this.widgets[0].id);
            }, 100);
        }
    },

    // Mudar de ferramenta
    switchWidget(widgetId) {
        const widget = this.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        this.activeWidgetId = widgetId;

        // Atualizar estados das abas na barra lateral
        this.widgets.forEach(w => {
            const tabEl = document.getElementById(`tab-${w.id}`);
            if (tabEl) {
                if (w.id === widgetId) {
                    tabEl.classList.add("active");
                } else {
                    tabEl.classList.remove("active");
                }
            }
        });

        // Atualizar cabeçalho da página
        document.getElementById("active-tool-title").textContent = widget.name;
        document.getElementById("active-tool-desc").textContent = widget.description || "";

        // Limpar e reconstruir contêiner
        const container = document.getElementById("widget-container");
        container.innerHTML = "";

        // Inicializar widget
        widget.init(container);
    },

    // Verificar se o servidor Flask está ativo e responder
    async checkServerStatus() {
        const statusEl = document.getElementById("server-status");
        try {
            const response = await fetch(`${this.apiBase}/api/inputs?type=all`);
            if (response.ok) {
                statusEl.textContent = "Online";
                statusEl.className = "status online";
            } else {
                throw new Error("Erro na API");
            }
        } catch (e) {
            statusEl.textContent = "Offline";
            statusEl.className = "status offline";
        }
    },

    // Utilitário para formatar bytes
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
};

// Iniciar verificador de status do backend
window.addEventListener("DOMContentLoaded", () => {
    Hub.checkServerStatus();
    // Verificar a cada 5 segundos
    setInterval(() => Hub.checkServerStatus(), 5000);
});
