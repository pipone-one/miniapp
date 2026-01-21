from fastapi import APIRouter, HTTPException, UploadFile, File, Form
import google.generativeai as genai
from PIL import Image
import io

from app.config import settings

router = APIRouter(prefix="/banana", tags=["banana"])


def get_genai_model():
    if not settings.google_api_key:
        return None
    genai.configure(api_key=settings.google_api_key)
    return genai.GenerativeModel('gemini-1.5-flash')


@router.post("/magic")
async def banana_magic(
    file: UploadFile = File(...),
    mode: str = Form("roast")  # roast, compliment, caption
):
    model = get_genai_model()
    if not model:
        raise HTTPException(status_code=503, detail="Google API Key missing")

    try:
        # Read image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        prompt = "Describe this image."
        if mode == "roast":
            prompt = "Look at this photo and give a funny, light-hearted roast of what's happening. Be witty but not mean. Russian language."
        elif mode == "compliment":
            prompt = "Look at this photo and give a genuine, high-energy compliment. Russian language."
        elif mode == "caption":
            prompt = "Generate 3 viral Instagram captions for this photo. Russian language."
            
        response = model.generate_content([prompt, image])
        return {"result": response.text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/faceswap")
async def banana_faceswap(file: UploadFile = File(...)):
    # Placeholder as we don't have Replicate/Fal key yet
    # But user gave Google key, so maybe they expect magic?
    # We will just return a message for now.
    return {
        "result": "⚠️ Face Swap требует GPU-сервер. Пока что я могу только анализировать фото (попробуй кнопку 'Магия')."
    }
