"""Chat routes: NL queries, history, voice."""
from datetime import datetime, timezone

import pandas as pd
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.services.ai_service import ask_about_data, generate_insights

router = APIRouter()


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    session_id: Optional[str] = None


@router.post("/message")
async def chat_message(body: ChatRequest, current_user=Depends(get_current_user)):
    db = get_db()
    uid = str(current_user["_id"])

    # Load dataset
    doc = await db.datasets.find_one({
        "_id": ObjectId(body.dataset_id),
        "user_id": uid,
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")

    df = pd.read_csv(doc["filepath"])

    # Load chat history for this session
    session_id = body.session_id or body.dataset_id
    history_cursor = db.chats.find(
        {"user_id": uid, "session_id": session_id},
    ).sort("created_at", 1).limit(20)
    history = [{"role": h["role"], "content": h["content"]} async for h in history_cursor]

    # Get AI response
    try:
        answer = await ask_about_data(body.message, df, history)
    except Exception as e:
        raise HTTPException(500, f"AI service error: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()

    # Save user message
    await db.chats.insert_one({
        "user_id": uid,
        "dataset_id": body.dataset_id,
        "session_id": session_id,
        "role": "user",
        "content": body.message,
        "created_at": now,
    })

    # Save assistant message
    await db.chats.insert_one({
        "user_id": uid,
        "dataset_id": body.dataset_id,
        "session_id": session_id,
        "role": "assistant",
        "content": answer,
        "created_at": now,
    })

    return {
        "message": answer,
        "session_id": session_id,
        "timestamp": now,
    }


@router.get("/history/{dataset_id}")
async def chat_history(dataset_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    cursor = db.chats.find({
        "user_id": str(current_user["_id"]),
        "dataset_id": dataset_id,
    }).sort("created_at", 1)
    messages = []
    async for msg in cursor:
        msg["id"] = str(msg.pop("_id"))
        messages.append(msg)
    return messages


@router.delete("/history/{dataset_id}")
async def clear_chat_history(dataset_id: str, current_user=Depends(get_current_user)):
    db = get_db()
    await db.chats.delete_many({
        "user_id": str(current_user["_id"]),
        "dataset_id": dataset_id,
    })
    return {"message": "Chat history cleared"}


@router.get("/sessions")
async def list_sessions(current_user=Depends(get_current_user)):
    """List all chat sessions for the current user."""
    db = get_db()
    pipeline = [
        {"$match": {"user_id": str(current_user["_id"])}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$session_id",
            "dataset_id": {"$first": "$dataset_id"},
            "last_message": {"$first": "$content"},
            "last_updated": {"$first": "$created_at"},
            "message_count": {"$sum": 1},
        }},
        {"$limit": 20},
    ]
    sessions = []
    async for s in db.chats.aggregate(pipeline):
        s["session_id"] = s.pop("_id")
        sessions.append(s)
    return sessions


@router.post("/insights/{dataset_id}")
async def ai_insights(dataset_id: str, current_user=Depends(get_current_user)):
    """Generate comprehensive AI insights for a dataset."""
    db = get_db()
    doc = await db.datasets.find_one({
        "_id": ObjectId(dataset_id),
        "user_id": str(current_user["_id"]),
    })
    if not doc:
        raise HTTPException(404, "Dataset not found")

    from app.services.analysis import run_eda
    df = pd.read_csv(doc["filepath"])
    eda = run_eda(df)

    try:
        insights = await generate_insights(df, eda)
    except Exception as e:
        raise HTTPException(500, f"AI insights error: {str(e)}")

    return insights
