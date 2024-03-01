from abc import ABC, abstractmethod


class ProductPresenter(ABC):
    @abstractmethod
    def present_product_details(self, product_details: dict) -> None:
        pass