from app.services.matcher import VerseMatcher
from app.services.quran_loader import VerseEntry


def test_matcher_finds_best_match():
    verses = [
        VerseEntry(surah=1, ayah=1, text="بِسْمِ اللَّهِ", text_norm="بسم الله"),
        VerseEntry(surah=1, ayah=2, text="الْحَمْدُ لِلَّهِ", text_norm="الحمد لله"),
    ]
    m = VerseMatcher(verses)
    res = m.match("الحمد لله رب العالمين")
    assert res is not None
    assert (res.surah, res.ayah) == (1, 2)
    assert 0.0 <= res.confidence <= 1.0


def test_matcher_handles_partial_phrase():
    verses = [
        VerseEntry(surah=1, ayah=1, text="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", text_norm="بسم الله الرحمن الرحيم"),
        VerseEntry(surah=1, ayah=2, text="الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", text_norm="الحمد لله رب العالمين"),
    ]
    m = VerseMatcher(verses)
    res = m.match("بسم الله الرحمن")
    assert res is not None
    assert (res.surah, res.ayah) == (1, 1)

