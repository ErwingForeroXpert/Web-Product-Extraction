from ..interfaces.repository import ProductRepository
from ..entities.product import Product
from pymongo import MongoClient


class MongoDBProductRepository(ProductRepository):

    def __init__(self, connection_string: str, database_name: str):
        self.client = MongoClient(connection_string)
        self.database = self.client[database_name]
        self.collection = self.database.products

    def set_product_info(self, product: Product) -> Product:

        product_dict = product.to_dict()
        result = self.collection.insert_one(product_dict)

        if result:
            product.id = result.inserted_id

        return product
