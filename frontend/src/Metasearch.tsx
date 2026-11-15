
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "./api";

type SearchItem = {
  title?: string;
  link?: string;
  url?: string;
  snippet?: string;
  content?: string;
  text?: string;
};

type ProviderData = {
  provider: string;
  results: SearchItem[];
  error?: string;
};

type SearchResponse = {
  query: string;
  results: Record<string, ProviderData>;
};

export default function Metasearch() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const searchQuery = query.trim();

    if (!searchQuery) {
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const response = await api(
        "metasearch/?q=" + encodeURIComponent(searchQuery)
      );

      setData(response);
    } catch {
      setError("Search request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Multiple search
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Search Google, Tavily, and Exa at the same time.
      </Typography>

      <form onSubmit={handleSearch}>
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <TextField
            fullWidth
            label="Search query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="For example: Paracetamol"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading || !query.trim()}
          >
            Search
          </Button>
        </div>
      </form>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <CircularProgress />
        </div>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <div>
          {Object.entries(data.results).map(([key, providerData]) => (
            <section key={key} style={{ marginBottom: 32 }}>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {providerData.provider}
                {" — "}
                {providerData.results?.length ?? 0} results
              </Typography>

              {providerData.error ? (
                <Alert severity="error">{providerData.error}</Alert>
              ) : (
                providerData.results?.map((item, index) => {
                  const link = item.link || item.url;
                  const description =
                    item.snippet || item.content || item.text;

                  return (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="h6">
                          {item.title || "Untitled result"}
                        </Typography>

                        {description && (
                          <Typography
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            {description}
                          </Typography>
                        )}

                        {link && (
                          <Typography sx={{ mt: 2 }}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open source
                            </a>
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
