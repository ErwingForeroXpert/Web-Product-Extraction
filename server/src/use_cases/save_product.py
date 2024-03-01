from src.interfaces.use_case import GetUserDetailsUseCase
from src.interfaces.repository import UserRepository
from src.interfaces.presenter import UserPresenter


class SetProductInfoInteractor(GetUserDetailsUseCase):
    def __init__(self, user_repository: UserRepository, user_presenter: UserPresenter):
        self.user_repository = user_repository
        self.user_presenter = user_presenter

    def execute(self, user_id: int) -> None:
        user_details = self.user_repository.get_user_by_id(user_id)
        if user_details:
            self.user_presenter.present_user_details(user_details.__dict__)
        else:
            print("User not found.")