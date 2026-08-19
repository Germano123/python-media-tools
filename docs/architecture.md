# Arquitetura de Software e Diretrizes do Projeto

Este documento detalha o padrão de arquitetura de software, a aplicação dos princípios **SOLID**, a estratégia para independência de bibliotecas de terceiros (agnosticismo tecnológico) e o plano de testes automatizados do **Media Tools HUB**.

---

## 1. Arquitetura Limpa (Clean Architecture)

A organização do código-fonte segue a separação de responsabilidades em camadas concêntricas. O principal objetivo é garantir que as regras de negócio de processamento de mídia não dependam de frameworks web (Flask), bibliotecas de terceiros (`MoviePy`, `Pillow`, `yt-dlp`) ou do sistema de arquivos diretamente.

```
       ┌────────────────────────────────────────────────────────┐
       │   Drivers & Entradas (Flask Routes, CLI, frontend)      │
       │     └─► [Interfaces / Portas de Entrada]                │
       │           └─► [Casos de Uso / Serviços de Aplicação]   │
       │                 └─► [Portas de Saída / Interfaces]      │
       │                       └─► [Adapters / Bibliotecas]     │
       └────────────────────────────────────────────────────────┘
```

### Camadas do Projeto

1. **Domínio / Entidades**:
   - Definições puras de dados. Ex: `MediaFile`, `TimeInterval`, `MetadataTag`.
   - Não importam nenhuma biblioteca externa além das padrão do Python.

2. **Casos de Uso / Serviços de Aplicação (Interfaces / Portas)**:
   - Definem *o que* o sistema faz.
   - Contêm as "Portas de Entrada" (Interfaces de Serviços) e as "Portas de Saída" (Interfaces de Bibliotecas/Processadores).
   - Exemplo: `VideoProcessorInterface` define métodos como `trim`, `crop`, `merge`.

3. **Adapters (Adaptadores de Tecnologia)**:
   - Implementações concretas das interfaces de mídia usando bibliotecas específicas.
   - Exemplo: `MoviePyVideoProcessor` implementa a interface `VideoProcessorInterface`.
   - Se amanhã decidirmos migrar de `MoviePy` para `FFmpeg` por subprocesso ou `PyAV`, apenas criaremos a classe `FfmpegVideoProcessor` sem tocar no restante do sistema.

4. **Drivers / Infraestrutura**:
   - Rotas Flask, controladores HTTP, arquivos temporários e carregamento de configurações.

---

## 2. Princípios SOLID Aplicados

### S — Single Responsibility Principle (Princípio da Responsabilidade Única)
- Cada serviço/caso de uso resolve **uma única** tarefa de mídia específica.
- Exemplo: O conversor de vídeo para GIF (`gif_converter`) não deve conter lógica de download de rede nem de corte avançado de áudio.

### O — Open/Closed Principle (Princípio Aberto/Fechado)
- O sistema é aberto para extensões, mas fechado para modificações.
- No frontend, o HUB descobre as ferramentas registrando widgets por meio de `Hub.registerWidget()`. Adicionar uma nova ferramenta requer apenas a criação de um arquivo JS novo e sua importação no `index.html`.
- No backend, novas rotas e serviços podem ser adicionados sem alterar a estrutura das ferramentas legadas.

### L — Liskov Substitution Principle (Princípio da Substituição de Liskov)
- As rotas do Flask consomem as interfaces abstratas. Qualquer classe que implemente a interface `VideoProcessorInterface` pode ser substituída sem quebrar as chamadas das rotas do servidor.

### I — Interface Segregation Principle (Princípio da Segregação de Interfaces)
- Clientes não devem ser forçados a depender de métodos que não utilizam.
- Separamos explicitamente as interfaces em `VideoProcessorInterface`, `AudioProcessorInterface` e `ImageProcessorInterface`. Um serviço que apenas comprime imagens não precisa enxergar contratos de concatenação de vídeos.

### D — Dependency Inversion Principle (Princípio da Inversão de Dependência)
- O servidor Flask (`app.py`) não importa implementações concretas diretamente nos controladores. Ele depende das interfaces abstratas.
- As dependências são instanciadas na inicialização e injetadas nos serviços (Injeção de Dependência).

---

## 3. Agnosticismo Tecnológico

Para evitar o acoplamento forte com bibliotecas como `MoviePy` ou `Pillow`, implementamos o padrão de projeto **Adapter**.

### Exemplo de Estrutura de Código

```python
# backend/domain/interfaces.py (Contrato Puro)
from abc import ABC, abstractmethod
from pathlib import Path

class VideoProcessorInterface(ABC):
    @abstractmethod
    def crop_video(self, input_path: Path, output_path: Path, x: int, y: int, width: int, height: int) -> None:
        pass

# backend/adapters/moviepy_adapter.py (Implementação Concreta)
from moviepy import VideoFileClip
from backend.domain.interfaces import VideoProcessorInterface

class MoviePyVideoProcessor(VideoProcessorInterface):
    def crop_video(self, input_path: Path, output_path: Path, x: int, y: int, width: int, height: int) -> None:
        with VideoFileClip(str(input_path)) as clip:
            cropped = clip.crop(x1=x, y1=y, width=width, height=height)
            cropped.write_videofile(str(output_path))
```

Desta forma, todo o código do Flask interage com a abstração `VideoProcessorInterface`, tornando o código totalmente agnóstico de qual tecnologia de vídeo está sendo executada por baixo dos panos.

---

## 4. Estratégia de Testes Automatizados

Garantir o funcionamento contínuo do HUB local exige testes automatizados que rodem sem depender de mídias pesadas reais de produção.

### 4.1 Testes Unitários
- **Objetivo**: Testar a lógica dos serviços isoladamente.
- **Estratégia**: Mocar as chamadas de bibliotecas de terceiros (usando `unittest.mock`) para garantir que os comandos corretos do `ffmpeg` ou os métodos das bibliotecas sejam acionados com os parâmetros adequados.
- **Vantagem**: Executam em frações de segundos.

### 4.2 Testes de Integração
- **Objetivo**: Testar o fluxo completo de processamento de ponta a ponta.
- **Geração de Mídia Fake (In-Memory/Lightweight)**:
  - **Imagens**: Usar a biblioteca `Pillow` para gerar imagens em formato binário simples (ex: quadrado vermelho de 100x100 pixels) salvas na pasta temporária.
  - **Áudio**: Usar a biblioteca padrão ou criar arrays curtos em formato Wave para gerar tons de áudio fictícios (sine wave de 1 segundo).
  - **Vídeo**: Criar vídeos de 1 segundo a partir das imagens geradas para alimentar os testes.
- **Execução**: Submeter esses arquivos fake aos serviços de processamento reais e verificar se o arquivo final (PDF, GIF, MP4 consolidado) é gerado fisicamente no diretório de outputs e possui os metadados esperados.

### Execução dos Testes
Será adotado o framework `pytest` para a execução da suíte de testes do projeto. Os testes serão organizados dentro de uma pasta `tests/` na raiz do repositório.
