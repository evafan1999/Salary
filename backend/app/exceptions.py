class NoApplicableRuleError(Exception):
    """Raised when no JobPayRule is effective for a job on a given date."""


class OverlappingRuleError(Exception):
    """Raised when a JobPayRule's effective date range overlaps an existing one for the same job."""


class PresetInUseError(Exception):
    """Raised when attempting to delete a PayRatePreset still referenced by a JobPayRule."""
