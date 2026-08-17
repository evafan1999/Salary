from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import get_settings

settings = get_settings()
engine = create_engine(
    f"sqlite:///{settings.database_path}",
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate_add_missing_columns()


def _migrate_add_missing_columns() -> None:
    """create_all() only creates tables that don't exist yet — it never adds
    new columns to a table that's already there. This app has no migration
    framework, so newly-added model fields need a small manual backfill here
    for databases created before the field existed (this is a no-op on a
    freshly created table, since create_all already included the column)."""
    with engine.connect() as conn:
        job_columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(job)")}
        if "color" not in job_columns:
            conn.exec_driver_sql("ALTER TABLE job ADD COLUMN color VARCHAR")
            conn.commit()


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
