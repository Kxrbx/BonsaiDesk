from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class BonsaiModelVariant:
    id: str
    label: str
    repo_id: str
    filename: str
    download_url: str
    size_hint: str
    requirements_hint: str
    license_name: str = "Apache-2.0"


BONSAI_MODEL_VARIANTS: tuple[BonsaiModelVariant, ...] = (
    BonsaiModelVariant(
        id="8B",
        label="Bonsai 8B",
        repo_id="prism-ml/Bonsai-8B-gguf",
        filename="Bonsai-8B.gguf",
        download_url="https://huggingface.co/prism-ml/Bonsai-8B-gguf/resolve/main/Bonsai-8B.gguf?download=true",
        size_hint="1.16 GB",
        requirements_hint="Best quality profile for desktop GPUs.",
    ),
    BonsaiModelVariant(
        id="4B",
        label="Bonsai 4B",
        repo_id="prism-ml/Bonsai-4B-gguf",
        filename="Bonsai-4B.gguf",
        download_url="https://huggingface.co/prism-ml/Bonsai-4B-gguf/resolve/main/Bonsai-4B.gguf?download=true",
        size_hint="572 MB",
        requirements_hint="Balanced speed and quality on mid-range hardware.",
    ),
    BonsaiModelVariant(
        id="1.7B",
        label="Bonsai 1.7B",
        repo_id="prism-ml/Bonsai-1.7B-gguf",
        filename="Bonsai-1.7B.gguf",
        download_url="https://huggingface.co/prism-ml/Bonsai-1.7B-gguf/resolve/main/Bonsai-1.7B.gguf?download=true",
        size_hint="248 MB",
        requirements_hint="Smallest and fastest variant for lightweight local usage.",
    ),
)


def get_model_variant(variant_id: str | None) -> BonsaiModelVariant:
    normalized = (variant_id or "8B").strip() or "8B"
    return next(
        (variant for variant in BONSAI_MODEL_VARIANTS if variant.id == normalized),
        BONSAI_MODEL_VARIANTS[0],
    )


def detect_model_variant_from_filename(filename: str | None) -> str:
    normalized = (filename or "").strip().lower()
    for variant in BONSAI_MODEL_VARIANTS:
        if variant.filename.lower() == normalized:
            return variant.id
    return "custom"
