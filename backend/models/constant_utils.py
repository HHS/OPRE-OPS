def lock_class_constants(cls, protected: set[str]):
    original_setattr = cls.__setattr__

    def __setattr__(self, key, value):
        if key in protected:
            raise AttributeError(f"Cannot reassign class constant: '{key}'")
        return original_setattr(self, key, value)

    def class_setattr(key, value):
        if key in protected:
            raise AttributeError(f"Cannot reassign class constant: '{key}'")
        return object.__setattr__(cls, key, value)

    cls.__setattr__ = __setattr__
    cls._locked_constants = protected

    # Prevent class-level assignment too
    def new_class_setattr(cls_inner, key, value):
        if key in protected:
            raise AttributeError(f"Cannot reassign class constant: '{key}'")
        return type.__setattr__(cls_inner, key, value)

    cls.__class__.__setattr__ = new_class_setattr

    return cls
