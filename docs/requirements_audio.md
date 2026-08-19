# Requisitos Funcionais — Módulo de Áudio

Este documento apresenta o detalhamento de engenharia e os requisitos para as ferramentas planejadas da categoria **Áudio** (AUD-001 a AUD-007) do **Media Tools HUB**.

---

## AUD-001: Converter (Conversão de Formatos)

*   **Objetivo**: Converter arquivos de áudio de qualquer formato de entrada para formatos populares comuns locais.
*   **Formatos de Entrada**: Formatos comuns de áudio (`.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, `.wma`).
*   **Formatos de Saída**: `.mp3`, `.wav`, `.ogg`, `.flac`.
*   **Processamento no Backend**: Transcodificar o codec do áudio usando o decodificador apropriado do `FFmpeg` com base na extensão e codec desejados.
*   **Interface Requerida**:
    *   Seletor de arquivo de áudio.
    *   Dropdown para escolher o formato de saída.
    *   Dropdown opcional para taxa de amostragem (sample rate: 44.1kHz, 48kHz, etc.) e bitrate (128kbps, 192kbps, 320kbps).
*   **Critérios de Aceite**:
    *   O arquivo de saída deve tocar sem ruídos de conversão ou cortes inesperados.
    *   Bitrate e taxa de amostragem configurados devem ser correspondentes aos do arquivo exportado.

---

## AUD-002: Compressor (Compressão de Áudio)

*   **Objetivo**: Reduzir o tamanho de arquivos de áudio controlando o bitrate ou utilizando codecs de compressão eficientes.
*   **Formatos de Entrada**: `.mp3`, `.wav`, `.flac`, `.ogg`, `.m4a`.
*   **Formatos de Saída**: `.mp3`, `.ogg`, `.m4a`.
*   **Processamento no Backend**: Aplicar compressão com perdas ajustando o bitrate (ex: comprimir um `.wav` bruto para `.mp3` de 128kbps ou VBR - Variable Bitrate).
*   **Interface Requerida**:
    *   Seletor de arquivo de áudio.
    *   Seletor deslizante (slider) de nível de qualidade: "Baixo tamanho" (bitrate menor) até "Alta fidelidade" (bitrate maior).
    *   Exibição do tamanho estimado antes do processamento.
*   **Critérios de Aceite**:
    *   O arquivo compactado deve possuir um tamanho de armazenamento inferior ao original.
    *   A redução não deve introduzir distorções metálicas excessivas caso o usuário selecione qualidade média/alta.

---

## AUD-003: Normalizer (Normalização de Volume)

*   **Objetivo**: Ajustar o ganho de áudio de um arquivo de forma que o pico de volume ou o volume médio percebido (LUFS) atinja um nível padrão ideal.
*   **Formatos de Entrada**: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.
*   **Formatos de Saída**: Preservar o formato de entrada ou converter para `.wav`/`.mp3`.
*   **Processamento no Backend**: Analisar o áudio para encontrar os picos de áudio e aplicar o ganho uniforme necessário usando filtros de normalização (ex: filtro `loudnorm` do `FFmpeg`).
*   **Interface Requerida**:
    *   Seletor de arquivo de áudio.
    *   Presets de normalização (ex: "Padrão Streaming/LUFS -14" ou "Volume Máximo de Pico").
*   **Critérios de Aceite**:
    *   O volume geral do arquivo deve estar normalizado sem ocorrência de distorções por saturação (*clipping*).

---

## AUD-004: Cutter (Cortador de Áudio por Intervalo)

*   **Objetivo**: Cortar um trecho específico de um áudio informando limites de início e fim.
*   **Formatos de Entrada**: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.
*   **Formatos de Saída**: Mesmo formato do arquivo de entrada ou `.mp3`.
*   **Processamento no Backend**: Realizar o corte a partir da posição em segundos usando comandos de corte de precisão do `FFmpeg` (`-ss` e `-to`/`-t`).
*   **Interface Requerida**:
    *   Seletor de arquivo de áudio.
    *   Inputs de tempo de início (HH:MM:SS ou MM:SS ou apenas segundos) e tempo de fim.
*   **Critérios de Aceite**:
    *   O áudio de saída deve conter apenas o intervalo especificado.
    *   Cortes em formatos compactados devem ser limpos e livres de ruídos na transição inicial.

---

## AUD-005: Merger (União de Áudios)

*   **Objetivo**: Concatenar múltiplos arquivos de áudio linearmente em um único arquivo de saída.
*   **Formatos de Entrada**: Lista de áudios (`.mp3`, `.wav`, `.ogg`, etc.).
*   **Formatos de Saída**: `.mp3` ou `.wav`.
*   **Processamento no Backend**: Padronizar as taxas de amostragem e layouts de canais (mono/estéreo) e unir as faixas usando filtro de concatenação do `FFmpeg`.
*   **Interface Requerida**:
    *   Upload de múltiplos áudios com drag & drop.
    *   Lista visual que permita ordenar as faixas.
*   **Critérios de Aceite**:
    *   Os áudios devem ser mesclados de forma fluida sem engasgos ou dessincronização nas transições das faixas.

---

## AUD-006: Fade (Efeitos de Fade-In e Fade-Out)

*   **Objetivo**: Aplicar aumento gradual de volume no início e atenuação gradual de volume no fim do áudio.
*   **Formatos de Entrada**: `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`.
*   **Formatos de Saída**: Mantém o formato original ou `.mp3`.
*   **Processamento no Backend**: Aplicar filtros de áudio `afade` do `FFmpeg` especificando o tipo (in ou out), ponto de partida e duração do efeito em segundos.
*   **Interface Requerida**:
    *   Seletor de arquivo de áudio.
    *   Duração do Fade-In (segundos) e duração do Fade-Out (segundos).
*   **Critérios de Aceite**:
    *   O volume deve iniciar do zero absoluto e atingir o ganho normal no tempo configurado.
    *   No fim da faixa, o volume deve sumir gradativamente até o silêncio total.

---

## AUD-007: Metadata (Gerenciador de ID3 / Metadados)

*   **Objetivo**: Visualizar, editar ou limpar metadados de identificação do arquivo de áudio (título, artista, álbum, ano, gênero, etc.).
*   **Formatos de Entrada**: `.mp3`, `.m4a`, `.ogg`, `.flac`.
*   **Formatos de Saída**: Mesmo arquivo com metadados editados.
*   **Processamento no Backend**: Ler e escrever tags ID3 usando bibliotecas especializadas (como `mutagen`) ou por meio do mapeamento de metadados do `FFmpeg`.
*   **Interface Requerida**:
    *   Formulário contendo campos de texto para metadados comuns.
    *   Opção para remoção de metadados ("Sanitização").
*   **Critérios de Aceite**:
    *   As informações alteradas pelo usuário devem refletir nos leitores de mídia nativos dos sistemas operacionais (Windows Explorer, macOS Finder).
