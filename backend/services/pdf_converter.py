from pathlib import Path
from PIL import Image

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"}


def images_to_pdf(image_paths: list, output_pdf: Path):
    """
    Converte uma lista de caminhos de imagens em um único arquivo PDF.
    """
    if not image_paths:
        raise RuntimeError("Nenhuma imagem fornecida para conversão em PDF.")

    output_pdf.parent.mkdir(parents=True, exist_ok=True)
    pdf_images = []

    try:
        for image_path in image_paths:
            image = Image.open(image_path).convert("RGB")
            pdf_images.append(image)

        # Primeira imagem inicia o PDF; as demais são páginas adicionais
        pdf_images[0].save(
            str(output_pdf),
            save_all=True,
            append_images=pdf_images[1:]
        )
    finally:
        # Fechar as imagens abertas para liberar recursos
        for img in pdf_images:
            try:
                img.close()
            except Exception:
                pass


def images_to_pdf_from_dir(input_dir: Path, output_pdf: Path):
    """
    Lê imagens de um diretório, ordena por números contidos no nome do arquivo e gera o PDF.
    """
    images = sorted(
        [
            file for file in input_dir.iterdir()
            if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
        ],
        key=lambda file: int("".join(filter(str.isdigit, file.stem))) if any(c.isdigit() for c in file.stem) else file.name
    )

    if not images:
        raise RuntimeError(f"Nenhuma imagem encontrada em {input_dir}")

    images_to_pdf(images, output_pdf)
