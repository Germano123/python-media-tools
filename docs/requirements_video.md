# Requisitos Funcionais — Módulo de Vídeo

Este documento apresenta o detalhamento de engenharia e os requisitos para as ferramentas planejadas da categoria **Vídeo** (VID-001 a VID-009) do **Media Tools HUB**.

---

## VID-001: Frames (Extração de Frames)

*   **Objetivo**: Extrair um frame específico (imagem) de um vídeo em uma minutagem determinada ou múltiplos frames baseados em intervalos.
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Imagens (`.png` ou `.jpg`). Em caso de múltiplos frames, gerar um arquivo `.zip` contendo todas as capturas.
*   **Processamento no Backend**: Ler o vídeo no frame alvo usando `opencv-python` ou `FFmpeg` e salvar como imagem através do `Pillow`.
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Escolha do modo: "Momento único" ou "Intervalo regular" (ex: a cada X segundos).
    *   Campo para inserir segundos ou carimbo de data/hora (HH:MM:SS) e formato de saída desejado.
*   **Critérios de Aceite**:
    *   Deve extrair a imagem exata do momento definido pelo usuário.
    *   Se o momento solicitado ultrapassar a duração do vídeo, retornar erro amigável ao usuário.

---

## VID-002: Trimmer Avançado (Cortes Múltiplos)

*   **Objetivo**: Realizar múltiplos cortes em um único arquivo de vídeo e gerar trechos separados ou uni-los sequencialmente em um novo arquivo.
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Um ou mais vídeos no formato `.mp4` (codec H.264).
*   **Processamento no Backend**: Cortar o vídeo sem decodificar totalmente (usando flags `-c copy` no `FFmpeg` para máxima velocidade) ou decodificando se houver necessidade de reprocessamento de frames chave.
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Tabela interativa para gerenciar trechos (Início - Fim - Nome do trecho).
    *   Checkbox para decidir se deseja baixar trechos em um `.zip` ou unificar todos em um único vídeo final de saída.
*   **Critérios de Aceite**:
    *   Cada trecho gerado deve respeitar exatamente a marcação de tempo fornecida.
    *   A união de múltiplos trechos não deve corromper o áudio ou dessincronizá-lo do vídeo.

---

## VID-003: Cropper (Recorte de Área)

*   **Objetivo**: Recortar espacialmente um vídeo (eliminar bordas, ajustar proporção).
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Aplicar filtros de recorte (ex: filtergraph `crop` do `FFmpeg` ou operações equivalentes de renderização).
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Entrada numérica para dimensões `X`, `Y` (posição inicial) e `Largura`, `Altura` (tamanho do corte).
    *   Presets de proporções comuns: `1:1` (quadrado), `16:9` (paisagem), `9:16` (retrato/Story/Reels).
*   **Critérios de Aceite**:
    *   O vídeo final deve conter apenas a região recortada mantendo o aspect ratio solicitado.
    *   Os valores de recorte não podem exceder a resolução máxima do vídeo de entrada.

---

## VID-004: Speed Controller (Controle de Velocidade)

*   **Objetivo**: Acelerar ou desacelerar a velocidade do vídeo e do áudio sincronizadamente.
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Ajustar o PTS (Presentation Time Stamp) do vídeo e aplicar filtros de áudio correspondentes (como `atempo` do `FFmpeg`) para que o áudio não sofra distorção de tom ("efeito esquilo").
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Barra seletora (slider) ou dropdown com multiplicadores de velocidade predefinidos (ex: `0.25x`, `0.5x`, `1.5x`, `2.0x`, `4.0x`).
*   **Critérios de Aceite**:
    *   O vídeo final deve reproduzir na velocidade selecionada de forma contínua.
    *   O áudio deve se manter perfeitamente sincronizado com o vídeo acelerado/desacelerado.

---

## VID-005: Reverse (Reprodução Reversa)

*   **Objetivo**: Criar uma versão do vídeo onde a reprodução ocorre do fim para o começo.
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Reverter os pacotes de frames de vídeo (filtro `reverse` do `FFmpeg`) e de áudio (filtro `areverse` do `FFmpeg`).
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Opção de silenciar o áudio no vídeo reverso (opcional).
*   **Critérios de Aceite**:
    *   O arquivo de saída deve começar exatamente do último frame do vídeo original e terminar no primeiro.
    *   O processamento não deve gerar artefatos visuais ou travamentos durante a renderização de vídeos curtos.

---

## VID-006: Loop (Repetição de Trechos)

*   **Objetivo**: Repetir um vídeo completo ou um trecho específico por uma determinada quantidade de vezes de forma contínua.
*   **Formatos de Entrada**: Vídeos comuns (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Cortar o trecho (se especificado), replicá-lo `N` vezes e concatená-los.
*   **Interface Requerida**:
    *   Seletor de vídeo.
    *   Campos opcionais para "Início" e "Fim" do trecho a sofrer loop.
    *   Entrada numérica para "Quantidade de Repetições" (ex: 2x, 5x, 10x).
*   **Critérios de Aceite**:
    *   O vídeo de saída deve ter a duração equivalente à multiplicação exata das repetições sem engasgos na transição de um ciclo para o outro.

---

## VID-007: Concatenar (União de Vídeos)

*   **Objetivo**: Juntar múltiplos arquivos de vídeo diferentes em uma única sequência linear.
*   **Formatos de Entrada**: Lista de vídeos (`.mp4`, `.mov`, `.avi`, `.mkv`, `.webm`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Concatenar vídeos. Em caso de resoluções ou codecs diferentes entre os arquivos de entrada, realizar o redimensionamento e transcodificação prévia para padronização antes da unificação.
*   **Interface Requerida**:
    *   Painel para arrastar múltiplos arquivos de vídeo.
    *   Lista visual de itens permitindo reordenação (subir/descer na fila).
*   **Critérios de Aceite**:
    *   Os vídeos devem tocar na ordem exata definida pelo usuário.
    *   Transições entre vídeos de diferentes resoluções ou taxas de quadros (FPS) devem ocorrer sem erros de reprodução no arquivo final.

---

## VID-008: Subtitles (Incorporação de Legendas)

*   **Objetivo**: Incorporar legendas de arquivos externos (renderizar diretamente na imagem do vídeo (hardsub) ou anexar na faixa de stream (softsub)).
*   **Formatos de Entrada**: Vídeo (`.mp4`, `.mov`, etc.) e arquivo de legenda (`.srt` ou `.vtt`).
*   **Formatos de Saída**: Vídeo `.mp4`.
*   **Processamento no Backend**: Ler o arquivo `.srt`/`.vtt` e aplicar o filtro de legenda (como `subtitles` do `FFmpeg`) durante o processo de transcodificação.
*   **Interface Requerida**:
    *   Seletor de arquivo de vídeo.
    *   Seletor de arquivo de legenda local.
    *   Escolha do modo: "Legenda Fixa (Queimada no Vídeo)" ou "Legenda Opcional (Selecionável)".
*   **Critérios de Aceite**:
    *   As legendas devem estar devidamente renderizadas e sincronizadas de acordo com o arquivo SRT enviado.
    *   Tratamento de caracteres especiais e acentuação no idioma Português (UTF-8).

---

## VID-009: Metadata (Gerenciamento de Metadados)

*   **Objetivo**: Visualizar informações de codecs/atributos do vídeo e permitir a edição de tags básicas (título, autor, data) ou a remoção completa de metadados privados.
*   **Formatos de Entrada**: Vídeos comuns.
*   **Formatos de Saída**: Vídeo com metadados alterados (mesmo formato ou `.mp4`).
*   **Processamento no Backend**: Extrair tags usando utilitários de leitura (ex: `ffprobe`) e reescrever tags através do `FFmpeg` preservando os fluxos de áudio e vídeo sem decodificar (`-c copy`).
*   **Interface Requerida**:
    *   Exibição em lista dos metadados extraídos (Resolução, Codecs, Duração, FPS, Tags).
    *   Campos editáveis de texto para tags comuns.
    *   Botão "Limpar todos os metadados" (Sanitização para privacidade).
*   **Critérios de Aceite**:
    *   Deve permitir visualizar metadados técnicos corretos do arquivo de entrada.
    *   O arquivo resultante deve conter apenas os metadados explícitos configurados pelo usuário.
