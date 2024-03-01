from abc import ABC, abstractmethod
from ..entities.product import Product


class SetProductInfoUseCase(ABC):
    @abstractmethod
    def execute(self, user: dict) -> Product:
        pass