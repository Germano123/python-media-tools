# Requisitos Funcionais — Módulo de Imagem

Este documento apresenta o detalhamento de engenharia e os requisitos para as ferramentas planejadas da categoria **Imagem** (IMG-001 a IMG-005) do **Media Tools HUB**.

---

## IMG-001: Converter (Conversão de Formatos)

*   **Objetivo**: Converter imagens entre diferentes formatos locais comuns.
*   **Formatos de Entrada**: Imagens comuns (`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.tiff`, `.gif`).
*   **Formatos de Saída**: `.png`, `.jpg`, `.webp`, `.bmp`.
*   **Processamento no Backend**: Ler o arquivo com a biblioteca `Pillow` e salvá-lo no formato de destino. No caso de conversões para `.jpg` / `.jpeg`, converter imagens com transparência (canal alpha) preenchendo o fundo com branco antes da gravação para evitar erros de renderização.
*   **Interface Requerida**:
    *   Seletor de imagem (única ou lote).
    *   Dropdown para escolher formato final.
*   **Critérios de Aceite**:
    *   A imagem gerada deve ser idêntica em conteúdo visual à original.
    *   Deve suportar conversão em lote gerando download unificado em formato `.zip`.

---

## IMG-002: Compressor (Compressão de Imagens)

*   **Objetivo**: Reduzir o peso físico de armazenamento das imagens aplicando compressão com perdas configurável ou algoritmos sem perdas.
*   **Formatos de Entrada**: `.png`, `.jpg`, `.jpeg`, `.webp`.
*   **Formatos de Saída**: Mesmo formato de entrada ou `.webp`.
*   **Processamento no Backend**: Controlar o fator de qualidade na gravação do Pillow (ex: `image.save(..., quality=85)`) e aplicar otimizações nativas da biblioteca.
*   **Interface Requerida**:
    *   Seletor de imagem.
    *   Slider com percentual de qualidade desejada (ex: de 10% a 100%).
    *   Exibição do tamanho original vs tamanho final aproximado.
*   **Critérios de Aceite**:
    *   A imagem gerada deve conter redução de peso em disco (kB/MB).
    *   O decréscimo visual não deve apresentar degradação excessiva na qualidade (padrão recomendado: 80-85%).

---

## IMG-003: Resizer (Redimensionamento)

*   **Objetivo**: Alterar as dimensões físicas da imagem (largura e altura) em pixels ou por proporção percentual.
*   **Formatos de Entrada**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`.
*   **Formatos de Saída**: Mesmo formato de entrada.
*   **Processamento no Backend**: Redimensionar a imagem no Pillow utilizando filtros de alta qualidade de interpolação (como `Resampling.LANCZOS`) para preservar a nitidez das bordas e texturas.
*   **Interface Requerida**:
    *   Seletor de imagem.
    *   Campos numéricos de Largura e Altura.
    *   Checkbox "Manter Proporções" (proporção automática baseada no aspecto original).
    *   Campo para escala percentual (ex: redimensionar em 50%).
*   **Critérios de Aceite**:
    *   A imagem resultante deve conter exatamente as novas dimensões especificadas.
    *   Não deve esticar ou achatar a imagem caso "Manter Proporções" esteja ativado.

---

## IMG-004: Cropper (Recorte Espacial)

*   **Objetivo**: Cortar uma sub-região específica da imagem.
*   **Formatos de Entrada**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`.
*   **Formatos de Saída**: Mesmo formato de entrada.
*   **Processamento no Backend**: Aplicar o método de recorte (ex: `crop((esquerda, topo, direita, base))`) da biblioteca Pillow.
*   **Interface Requerida**:
    *   Seletor de imagem.
    *   Inputs numéricos: `X`, `Y` (canto superior esquerdo) e `Largura`, `Altura` da caixa de recorte.
    *   Proporções predefinidas comuns (1:1 quadrado, 4:3, 16:9).
*   **Critérios de Aceite**:
    *   A nova imagem gerada deve consistir apenas da região do retângulo selecionado.
    *   O retângulo de corte não pode exceder as bordas da imagem original.

---

## IMG-005: Metadata (Gerenciador EXIF / Metadados)

*   **Objetivo**: Visualizar, editar tags ou remover completamente os metadados (como tags EXIF contendo geolocalização, câmera, data da foto e software).
*   **Formatos de Entrada**: `.jpg`, `.jpeg`, `.png`, `.webp`.
*   **Formatos de Saída**: Mesmo formato de entrada.
*   **Processamento no Backend**: Extrair informações EXIF de imagens usando o Pillow. Para remoção, salvar a imagem descartando a tabela de metadados binária (EXIF/IPTC/XMP).
*   **Interface Requerida**:
    *   Painel que mostra a lista de informações EXIF detectadas (Câmera, Abertura, GPS, Data).
    *   Botão "Limpar todos os metadados EXIF" para privacidade.
*   **Critérios de Aceite**:
    *   O arquivo resultante não deve conter nenhuma tag de localização ou dados de captura da câmera (EXIF zerado) se o usuário escolher a sanitização.
