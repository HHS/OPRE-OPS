from typing import Type
from uuid import uuid4

import factory
from faker import Faker

from ops_api.ops.users.models import User


fake = Faker()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model: Type[User] = User

    first_name: str = fake.first_name()
    last_name: str = fake.last_name()
    uuid: str = uuid4()
    email: str = fake.safe_email()
    role: str = "Budget-Officer"
    is_active: bool = True
    is_staff: bool = True
    is_superuser: bool = True
