# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer

app = FastAPI()

model = SentenceTransformer("all-MiniLM-L6-v2")


@app.post("/embed")
def generate_embedding(text: str):
    embedding = model.encode(text).tolist()

    return {
        "embedding": embedding,
        "dimension": len(embedding)
    }