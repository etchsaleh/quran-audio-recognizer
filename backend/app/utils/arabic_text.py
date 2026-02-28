from __future__ import annotations

import re

# Arabic diacritics (tashkeel) + Qur'anic annotation marks (common range)
_DIACRITICS_RE = re.compile(
    r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]"
)

_PUNCT_RE = re.compile(r"[^\u0600-\u06FF\s]")
_WS_RE = re.compile(r"\s+")


_CHAR_MAP = str.maketrans(
    {
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ؤ": "و",
        "ئ": "ي",
        "ة": "ه",
        "ـ": "",  # tatweel
    }
)


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for matching:
    - remove diacritics / Qur'anic marks
    - unify common letter variants
    - remove non-Arabic punctuation/symbols
    - normalize whitespace
    """
    t = text.strip()
    t = _DIACRITICS_RE.sub("", t)
    t = t.translate(_CHAR_MAP)
    t = _PUNCT_RE.sub(" ", t)
    t = _WS_RE.sub(" ", t).strip()
    return t

