from __future__ import annotations

import logging


def configure_logging(env: str) -> None:
    level = logging.INFO if env.lower() in {"prod", "production"} else logging.DEBUG
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )

