from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starpoint.db import Client
import clip
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def encode_search_query(search_query):
    with torch.no_grad():
        # Encode and normalize the search query using CLIP
        text_encoded = model.encode_text(clip.tokenize(search_query).to(device))
        text_encoded /= text_encoded.norm(dim=-1, keepdim=True)

    # Retrieve the feature vector
    return text_encoded


class SearchQuery(BaseModel):
    starpoint_api_key: str = Field(..., title="Starpoint API Key")
    starpoint_collection_name: str = Field(..., title="Starpoint Collection Name")
    query_to_embed: str = Field(None, title="Query to Embed")
    sql: str = Field(None, title="SQL")


@app.get("/search")
async def perform_embedding_search(query: SearchQuery):
    starpoint_api_key = query.starpoint_api_key
    starpoint_collection_name = query.starpoint_collection_name
    query_to_embed = query.query_to_embed
    sql = query.sql

    query_embedding = None
    if query_to_embed is not None:
        query_embedding = encode_search_query(query_to_embed).tolist()[0]

    starpoint_client = Client(api_key=starpoint_api_key)
    response = starpoint_client.query(
        collection_name=starpoint_collection_name,
        sql=sql,
        query_embedding=query_embedding[0],
    )

    return response
