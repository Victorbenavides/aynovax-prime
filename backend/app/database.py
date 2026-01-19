from sqlmodel import SQLModel, create_engine, Session

# Using SQLite for simplicity (creates a file 'aynovax.db' automatically)
sqlite_file_name = "aynovax_operations.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread=False is needed for SQLite with FastAPI
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """Initializes the database schema."""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Dependency for FastAPI endpoints."""
    with Session(engine) as session:
        yield session