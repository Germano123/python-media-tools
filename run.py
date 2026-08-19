import sys
import webbrowser
import threading
import time
from pathlib import Path

# Adiciona a pasta do projeto ao path
project_root = Path(__file__).resolve().parent
sys.path.append(str(project_root))

from backend.app import app

def open_browser():
    # Aguarda o servidor Flask inicializar
    time.sleep(1.5)
    webbrowser.open("http://127.0.0.1:5000/")

if __name__ == "__main__":
    print("Iniciando o Media Tools HUB...")
    print("O navegador abrirá automaticamente em http://127.0.0.1:5000/")
    
    # Inicia a thread para abrir o navegador
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Inicia o servidor Flask localmente
    app.run(host="127.0.0.1", port=5000, debug=False)
