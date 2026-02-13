import random
from datetime import datetime

import pandas as pd

from .constants import MERCHANTS, CITIES, CARD_TYPES, FRAUD_RATE


def generate_transactions(count: int = 500, seed: int | None = None) -> pd.DataFrame:
    """Generate synthetic transaction data matching the JS generator's distributions."""
    if seed is not None:
        random.seed(seed)

    rows: list[dict] = []

    for i in range(count):
        is_fraud = random.random() < FRAUD_RATE

        # Hour: fraud skews toward 1am-5am (60% chance)
        if is_fraud:
            hour = (
                random.randint(1, 5)
                if random.random() < 0.6
                else random.randint(0, 23)
            )
        else:
            hour = random.randint(0, 23)

        # Amount: fraud skews high (50% chance of $2000-$10000)
        if is_fraud:
            amount = (
                random.random() * 8000 + 2000
                if random.random() < 0.5
                else random.random() * 500 + 10
            )
        else:
            amount = random.random() * 400 + 5

        velocity = (
            random.randint(5, 19) if is_fraud else random.randint(1, 4)
        )
        dist_from_home = (
            random.random() * 8000 + 500 if is_fraud else random.random() * 200
        )

        # Fraud can use any merchant/city; legitimate skews toward first few
        merchant = random.choice(
            MERCHANTS if is_fraud else MERCHANTS[:8]
        )
        city = random.choice(
            CITIES if is_fraud else CITIES[:5]
        )

        rows.append(
            {
                "id": f"TXN-{i + 1:05d}",
                "amount": round(amount, 2),
                "merchant": merchant,
                "city": city,
                "card_type": random.choice(CARD_TYPES),
                "hour": hour,
                "velocity": velocity,
                "dist_from_home": round(dist_from_home),
                "is_fraud": is_fraud,
                "date": datetime(
                    2026, 2, random.randint(1, 13), hour, random.randint(0, 59)
                ).isoformat(),
            }
        )

    return pd.DataFrame(rows)
