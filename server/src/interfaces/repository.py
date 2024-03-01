from abc import ABC, abstractmethod
from ..entities.product import Product


class ProductRepository(ABC):

    @abstractmethod
    def set_product_info(self, product: Product) -> Product:
        pass