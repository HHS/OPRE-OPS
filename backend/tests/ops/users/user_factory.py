from typing import Type
import factory
from faker import Faker

fake = Faker()

from ops_api.ops.users.models import User


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model: Type[User] = User

    username: str = fake.user_name()
    oidc_id: str = fake.bothify(text="????-####-????")
    email: str = fake.safe_email()
    role: str = "Budget-Officer"
    is_active: bool = True
    is_staff: bool = True
    is_superuser: bool = True
