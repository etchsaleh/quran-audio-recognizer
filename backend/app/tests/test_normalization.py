from app.utils.arabic_text import normalize_arabic


def test_normalize_arabic_removes_diacritics_and_unifies_letters():
    # "ٱ" and diacritics should be normalized
    inp = "ٱلرَّحْمَٰنِ الرَّحِيمِ"
    out = normalize_arabic(inp)
    assert out == "الرحمن الرحيم"

