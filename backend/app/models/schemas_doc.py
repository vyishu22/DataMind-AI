"""
MongoDB Collection Schemas — DataMind AI
=========================================
These are the document shapes stored in MongoDB Atlas.
Motor (async) is used; no ODM schema enforcement by default,
but Pydantic schemas validate at the API layer.
"""

# ── users ─────────────────────────────────────────────────────────────────────
USER_SCHEMA = {
    "_id": "ObjectId",
    "name": "str",
    "email": "str (unique index)",
    "hashed_password": "str (bcrypt)",
    "plan": "str  # free | pro | enterprise",
    "datasets_count": "int",
    "avatar": "str | None",
    "created_at": "ISO datetime str",
}

# ── datasets ──────────────────────────────────────────────────────────────────
DATASET_SCHEMA = {
    "_id": "ObjectId",
    "user_id": "str (ref users._id, index)",
    "name": "str",
    "filename": "str  # saved filename on disk",
    "filepath": "str  # absolute path",
    "original_name": "str",
    "rows": "int",
    "columns": "int",
    "column_names": ["str"],
    "dtypes": {"col": "dtype_str"},
    "preview": [{"col": "value"}],
    "missing_total": "int",
    "duplicate_rows": "int",
    "is_merged": "bool | None",
    "source_ids": ["str"] ,  # for merged datasets
    "created_at": "ISO datetime str",
}

# ── chats ─────────────────────────────────────────────────────────────────────
CHAT_SCHEMA = {
    "_id": "ObjectId",
    "user_id": "str (index)",
    "dataset_id": "str (ref datasets._id)",
    "session_id": "str",
    "role": "str  # user | assistant",
    "content": "str",
    "created_at": "ISO datetime str",
}

# ── reports ───────────────────────────────────────────────────────────────────
REPORT_SCHEMA = {
    "_id": "ObjectId",
    "user_id": "str (index)",
    "dataset_id": "str",
    "dataset_name": "str",
    "filename": "str",
    "filepath": "str",
    "health_score": "int | None",
    "created_at": "ISO datetime str",
}

"""
Indexes created on startup (see app/core/database.py):
  db.users.create_index("email", unique=True)
  db.datasets.create_index("user_id")
  db.chats.create_index([("user_id", 1), ("dataset_id", 1)])
  db.reports.create_index("user_id")
"""
