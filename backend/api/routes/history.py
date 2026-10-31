"""Translation history query and deletion endpoints."""
from fastapi import APIRouter, HTTPException
from backend.database.models import get_all_translation_history, delete_translation_history_item

router = APIRouter(tags=["history"])


@router.get("/history")
async def get_history(limit: int = 50):
    return {"history": get_all_translation_history(limit=limit)}


@router.delete("/history/{history_id}")
async def delete_history(history_id: int):
    deleted = delete_translation_history_item(history_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="History record not found")
    return {"status": "deleted", "id": history_id}
