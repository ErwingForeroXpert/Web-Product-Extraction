from dataclasses import dataclass
from typing import Optional, Tuple

@dataclass
class Product:
    location: Tuple[float, float]
    detect_type: str
    image_url: str
    id: Optional[int] = None

    def to_dict(self):
        return {
            "location": self.location,
            "detect_type": self.detect_type,
            "image_url": self.image_url
        }