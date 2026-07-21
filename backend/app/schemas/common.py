def empty_str_to_none(value):
    """HTML forms submit empty optional number/date inputs as "" rather than
    omitting the field; Pydantic's Decimal/date parsers reject "" outright.
    Use as a `mode="before"` field_validator on any optional non-string field.
    """
    if value == "":
        return None
    return value
