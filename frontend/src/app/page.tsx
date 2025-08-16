"use client";

import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import Link from "next/link";

export default function Home() {
  const { articles, loading, error } = useArticles();

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Mediearn</h1>
          <p className='text-xl text-muted-foreground mb-8'>
            A decentralized content platform where creators can monetize their
            articles
          </p>
        </div>

        {/* Articles Section */}
        <div className='mt-12'>
          <h2 className='text-2xl font-bold mb-6'>Latest Articles</h2>

          {loading && (
            <div className='text-center py-8'>
              <p>Loading articles...</p>
            </div>
          )}

          {error && (
            <div className='text-center py-8 text-red-500'>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && articles.length === 0 && (
            <div className='text-center py-8'>
              <p>No articles found. Be the first to upload one!</p>
            </div>
          )}

          {!loading && !error && articles.length > 0 && (
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {articles.map((article) => (
                <div
                  key={article.id}
                  className='border rounded-lg p-6 hover:shadow-md transition-shadow'
                >
                  <h3 className='font-semibold text-lg mb-2'>
                    {article.title || article.fileName || "Untitled"}
                  </h3>
                  <p className='text-muted-foreground text-sm mb-4'>
                    {article.description || "No description available"}
                  </p>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      {article.category || "Uncategorized"}
                    </span>
                    <span className='text-sm font-medium text-blue-600'>
                      {article.ownerAddress
                        ? `${article.ownerAddress.slice(0, 6)}...`
                        : article.owner?.suiAddress
                        ? `${article.owner.suiAddress.slice(0, 6)}...`
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
