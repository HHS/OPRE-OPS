class DocumentNotFoundError(Exception):
    """
    Exception to raise when the document is not found.
    """

    pass


class DocumentAlreadyExistsError(Exception):
    """
    Exception to raise when the document already exists.
    """

    pass


class UnsupportedProviderError(Exception):
    """
    Exception to raise when the provider is not supported.
    """

    pass
