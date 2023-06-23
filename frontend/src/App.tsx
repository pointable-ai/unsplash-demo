import { useState, useCallback } from "react";

export interface SearchQuery {
  starpoint_api_key: string;
  starpoint_collection_name: string;
  query_to_embed?: string;
  sql?: string;
}

export interface QueryResponse {
  collection_id: string;
  result_count: number;
  sql?: string | undefined | null;
  results: {
    __id: string;
    __distance?: number;
    [key: string]: string | number | undefined | null;
  }[];
}

async function search(data: SearchQuery): Promise<QueryResponse> {
  const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/search`, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify(data),
  });
  return response.json() as Promise<QueryResponse>;
}

const App = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [collectionName, setCollectionName] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [sql, setSql] = useState<string>("");
  const [results, setResults] = useState<QueryResponse["results"]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const triggerSearch = useCallback(async () => {
    if (!apiKey || !collectionName) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await search({
        starpoint_api_key: apiKey,
        starpoint_collection_name: collectionName,
        query_to_embed: query,
        sql,
      });
      setResults(response.results);
    } catch (e) {
      let err = e as Error;
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, sql, apiKey, collectionName]);

  return (
    <div>
      <h1>Welcome to Starpoint's Natural Language Image Search Demo</h1>

      <div>
        <label>API Key</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <label>Collection Name</label>
        <input
          type="text"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
        />
        <label>Natural Language Search</label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>Filter Metadata with SQL</label>
        <input
          type="text"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
        />
        <button
          disabled={loading || !apiKey || !collectionName}
          onClick={triggerSearch}
        >
          Search
        </button>
      </div>
      <div>
        {loading && <div>Loading...</div>}
        {error && <div>{error}</div>}
        {results.map((result) => {
          const WIDTH = 320;
          const photoId = result["photo_id"] as string;
          const photoUrl = `https://unsplash.com/photos/${photoId}/download?w=${WIDTH}`;
          return (
            <div>
              <img
                style={{ width: `${WIDTH}px`, height: "auto" }}
                src={photoUrl}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
