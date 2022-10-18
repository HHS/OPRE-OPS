from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.models import BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, fname, lname, email, uuid, **kwargs):
        """Create and return a `User`"""
        if uuid is None:
            raise TypeError("Users must have a uuid.")
        if email is None:
            raise TypeError("Users must have an email.")

        user = self.model(
            first_name=fname,
            last_name=lname,
            email=self.normalize_email(email),
            uuid=uuid,
        )

        user.save(using=self._db)
        return user

    def create_superuser(self, fname, lname, email, uuid):
        """
        Create and return a `User` with superuser (admin) permissions.
        """
        if email is None:
            raise TypeError("Superusers must have an email.")

        if uuid is None:
            uuid = uuid.uuid4

        user = self.create_user(fname, lname, email, uuid)
        user.is_superuser = True
        user.is_staff = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    uuid = models.CharField(
        db_index=True,
        max_length=36,
        unique=True,
        editable=False,
    )
    first_name = models.CharField(db_index=True, max_length=255, null=True)
    last_name = models.CharField(db_index=True, max_length=255, null=True)
    email = models.EmailField(db_index=True, unique=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(null=True)
    role = models.CharField(db_index=True, max_length=255)
    profile_image = models.ImageField(upload_to=f"user_files/{uuid}.png", null=True)
    auth_token = models.TextField(null=True)

    USERNAME_FIELD = "uuid"
    REQUIRED_FIELDS = ["email"]

    objects = UserManager()

    def __str__(self):
        return f"{self.email}"
