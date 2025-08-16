import { useState, useEffect } from "react";
import { apiClient, Article } from "@/lib/api";

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch articles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return { articles, loading, error, refetch: fetchArticles };
}

export function useArticlesByOwner(address: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const data = await apiClient.getArticlesByOwner(address);
      setArticles(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch articles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [address]);

  return { articles, loading, error, refetch: fetchArticles };
}
