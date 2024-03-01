from ..interfaces.presenter import ProductPresenter
from ..entities.product import Product


class ConsoleProductPresenter(ProductPresenter):
    def present_details(self, product_details: dict) -> None:
        product = Product(**product_details)
        print(f"Product ID: {product.id}, Type: {product.detect_type}, location: {product.location}")
