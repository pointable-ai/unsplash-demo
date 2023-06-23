from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starpoint.db import Client
import clip
import torch
from typing import Optional, List

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def encode_search_query(search_query: str):
    with torch.no_grad():
        # Encode and normalize the search query using CLIP
        text_encoded = model.encode_text(clip.tokenize(search_query).to(device))
        text_encoded /= text_encoded.norm(dim=-1, keepdim=True)

    # Retrieve the feature vector
    return text_encoded


class SearchQuery(BaseModel):
    starpoint_api_key: str = Field(..., title="Starpoint API Key")
    starpoint_collection_name: str = Field(..., title="Starpoint Collection Name")
    query_to_embed: Optional[str] = Field(None, title="Query to Embed")
    sql: str = Field(None, title="SQL")


@app.post("/search")
async def perform_embedding_search(query: SearchQuery):
    starpoint_api_key = query.starpoint_api_key
    starpoint_collection_name = query.starpoint_collection_name
    query_to_embed = query.query_to_embed
    sql = query.sql if len(query.sql) != 0 else None

    query_embedding: List[float] | None = None
    if query_to_embed is not None:
        query_embedding = encode_search_query(query_to_embed).tolist()[0]

    starpoint_client = Client(api_key=starpoint_api_key)
    response = starpoint_client.query(
        collection_name=starpoint_collection_name,
        sql=sql,
        query_embedding=query_embedding,
    )

    return response
