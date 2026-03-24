BLOCKED_TERMS = {"cheap", "bargain-bin", "mass-produced", "low-end"}
REQUIRED_TONE_TERMS = {"bespoke", "craftsmanship", "hatton garden"}


def enforce_brand_dna(text: str) -> tuple[str, list[str]]:
    lower = text.lower()
    reasons: list[str] = []
    if any(term in lower for term in BLOCKED_TERMS):
        reasons.append("Contains non-luxury positioning language.")
        return "block", reasons

    missing = [term for term in REQUIRED_TONE_TERMS if term not in lower]
    if missing:
        reasons.append(f"Missing core brand DNA terms: {', '.join(missing)}.")
        return "revise", reasons

    return "pass", ["Aligned with luxury bespoke brand tone."]
