# Planejamento de Sprints e Próximos Passos

Este documento detalha o planejamento dos ciclos de desenvolvimento (Sprints), a distribuição das ferramentas planejadas e do backlog, além dos próximos passos práticos para a equipe.

---

## 1. Calendário de Sprints Proposto

Cada Sprint tem duração sugerida de **1 semana** de desenvolvimento, dado o escopo local de ferramentas independentes.

### 📋 Sprint 0: Setup da Arquitetura & Infraestrutura (Core)
*   **Foco**: Base estrutural do projeto, segurança das interfaces e infraestrutura de testes.
*   **Tarefas**:
    1.  Criação das classes abstratas base (Ports): `VideoProcessorInterface`, `AudioProcessorInterface`, `ImageProcessorInterface`.
    2.  Setup do mecanismo de injeção de dependência e containers no Flask.
    3.  Setup da suíte de testes com `pytest`.
    4.  Criação do módulo utilitário de geração de mídias leves de teste (Mocks/Fakes binários).
    5.  Refatoração preliminar das rotas e das 5 ferramentas existentes para o padrão SOLID/Port-Adapter.
*   **Entrega**: Core da aplicação validado por testes unitários de integração vazios.

---

### 🎵 Sprint 1: Módulo de Áudio (AUD)
*   **Foco**: Desenvolver as ferramentas e APIs de processamento de áudio.
*   **Ferramentas**:
    -   `AUD-001`: Conversão de formatos (MP3, WAV, etc.).
    -   `AUD-002`: Compressor de tamanho.
    -   `AUD-003`: Normalizador de volume (LUFS / Pico).
    -   `AUD-004`: Cortador por intervalo (Cutter).
    -   `AUD-005`: Junção de faixas (Merger).
    -   `AUD-006`: Efeitos de Fade-In / Fade-Out.
    -   `AUD-007`: Visualizador/Editor de Metadados de Áudio.
*   **Infraestrutura**: Testes automatizados para cada serviço de áudio criado.
*   **Entrega**: Aba de áudio do HUB 100% funcional.

---

### 🖼️ Sprint 2: Módulo de Imagem (IMG)
*   **Foco**: Desenvolver as ferramentas e APIs de processamento de imagens.
*   **Ferramentas**:
    -   `IMG-001`: Conversão de formatos (PNG, JPG, etc.).
    -   `IMG-002`: Compressor de imagem.
    -   `IMG-003`: Redimensionamento físico (Resizer).
    -   `IMG-004`: Cortador de sub-região (Cropper).
    -   `IMG-005`: Visualizador/Editor/Removedor de EXIF (Metadados).
*   **Infraestrutura**: Testes automatizados para cada serviço de imagem criado.
*   **Entrega**: Aba de imagem do HUB 100% funcional.

---

### 🎬 Sprint 3: Módulo de Vídeo — Parte 1 (VID)
*   **Foco**: Desenvolver a primeira parte das ferramentas de vídeo.
*   **Ferramentas**:
    -   `VID-001`: Extração de frames (imagens).
    -   `VID-002`: Trimmer avançado (múltiplos intervalos).
    -   `VID-003`: Recorte espacial do vídeo (Cropper).
    -   `VID-004`: Controle de velocidade de reprodução.
    -   `VID-005`: Vídeo de trás para frente (Reverse).
*   **Infraestrutura**: Testes automatizados para cada uma das ferramentas.
*   **Entrega**: Primeira metade das funcionalidades de vídeo ativas no HUB.

---

### 🎬 Sprint 4: Módulo de Vídeo — Parte 2 & Integração Final
*   **Foco**: Conclusão do roadmap de vídeo e consolidação estética do HUB.
*   **Ferramentas**:
    -   `VID-006`: Loop de trechos.
    -   `VID-007`: Concatenação de vídeos.
    -   `VID-008`: Incorporação de legendas (SRT/VTT).
    -   `VID-009`: Visualizador/Editor de Metadados de Vídeo.
*   **Polimento**:
    -   Limpeza e melhoria visual do layout (Roxo e Cinza Claro).
    -   Estratégia de limpeza automática de arquivos temporários excedentes na pasta `data/temp/`.
*   **Entrega**: HUB 100% concluído do ponto de vista do Roadmap MVP.

---

## 2. Gerenciamento do Backlog

As ferramentas do backlog estratégico (silence removers, remoção de fundo, colagens, etc.) permanecem congeladas e serão alocadas a partir do **Sprint 5** após a validação completa do MVP.

| ID | Categoria | Ferramenta | Dependência Técnica para Desbloqueio |
|---|---|---|---|
| VID-B01 | Vídeo | Fade | Módulo de Vídeo Estável |
| VID-B02 | Vídeo | Compressor | Módulo de Vídeo Estável |
| VID-B03 | Vídeo | Resizer | Módulo de Vídeo Estável |
| AUD-B01 | Áudio | Silence Remover | Lib `pydub` ou `numpy` avançado |
| AUD-B02 | Áudio | Waveform | Lib de plotagem de imagem binária |
| AUD-B03 | Áudio | Spectrogram | Lib `scipy` / `matplotlib` |
| AUD-B04 | Áudio | Extractor | Conhecimento de desmultiplexação de canais |
| AUD-B05 | Áudio | Vocal Remover | Modelos de separação de faixas (IA / fora de escopo atual) |
| IMG-B01 | Imagem | Background Remover | Modelos de segmentação local (como Rembg) |
| IMG-B02 | Imagem | Color Palette Extractor | Algoritmo K-Means no Pillow / Numpy |
| IMG-B03 | Imagem | Blur / Pixelate | Filtros de imagem Pillow (ImageFilter) |
| IMG-B04 | Imagem | Mosaic / Collage | Grid matemático no Canvas do Pillow |

---

## 3. Próximos Passos Imediatos

Para iniciar o desenvolvimento após aprovação deste planejamento:

1.  **Aprovação do Sprint 0**: Iniciar a infraestrutura técnica e refatoração base para alinhar com os padrões SOLID e testes.
2.  **Configuração de Testes**: Instalar `pytest` no ambiente virtual e criar os primeiros mocks de vídeo, áudio e imagem para validação da esteira.
3.  **Encapsulamento de APIs**: Isolar o Flask e encapsular o `yt-dlp` e `ffmpeg` em contratos agnósticos no código atual.
