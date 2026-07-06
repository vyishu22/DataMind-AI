"""MongoDB connection via Motor (async)."""
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient | None = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    # users
    await db.users.create_index("email", unique=True)
    # sessions
    await db.sessions.create_index("userId")
    await db.sessions.create_index("refreshToken")
    await db.sessions.create_index("expiresAt", expireAfterSeconds=0)  # TTL auto-cleanup
    # datasets
    await db.datasets.create_index("user_id")
    # chats
    await db.chats.create_index([("user_id", 1), ("dataset_id", 1)])
    # reports
    await db.reports.create_index("user_id")
    print(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def disconnect_db():
    global client
    if client:
        client.close()
        print("🔌 MongoDB disconnected")


def get_db():
    return db
