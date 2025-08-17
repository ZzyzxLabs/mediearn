"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw"; // only if you want to allow raw HTML in MD
import rehypeSanitize from "rehype-sanitize";

type Props = {
  src?: string;
  content?: string;
};

export default function MarkdownViewer({ src, content }: Props) {
  const [md, setMd] = useState<string>("");

  useEffect(() => {
    if (content) {
      setMd(content);
    } else if (src) {
      fetch(src)
        .then((r) => r.text())
        .then(setMd)
        .catch(console.error);
    }
  }, [src, content]);

  if (!md) return <div className='text-sm text-muted-foreground'>Loading…</div>;

  return (
    <article className='prose prose-slate dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          // Style links with shadcn colors
          a: ({ node, ...props }) => (
            <a
              {...props}
              className='text-primary hover:text-primary/80 underline underline-offset-4 transition-colors'
            />
          ),
          // Style headings with shadcn typography
          h1: ({ node, ...props }) => (
            <h1
              {...props}
              className='scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 mt-6'
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              {...props}
              className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0 mb-4 mt-6'
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              {...props}
              className='scroll-m-20 text-2xl font-semibold tracking-tight mb-3 mt-5'
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              {...props}
              className='scroll-m-20 text-xl font-semibold tracking-tight mb-2 mt-4'
            />
          ),
          // Style paragraphs
          p: ({ node, ...props }) => (
            <p
              {...props}
              className='leading-7 [&:not(:first-child)]:mt-6 mb-4 text-lg'
            />
          ),
          // Style lists
          ul: ({ node, ...props }) => (
            <ul
              {...props}
              className='my-6 ml-6 list-disc [&>li]:mt-2 text-lg'
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              {...props}
              className='my-6 ml-6 list-decimal [&>li]:mt-2 text-lg'
            />
          ),
          // Style code blocks
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  {...props}
                  className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-base font-semibold'
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                {...props}
                className='relative rounded-lg bg-muted px-[0.3rem] py-[0.2rem] font-mono text-base font-semibold block p-4 my-4'
              >
                {children}
              </code>
            );
          },
          // Style blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              {...props}
              className='mt-6 border-l-2 border-primary pl-6 italic text-lg'
            />
          ),
          // Style horizontal rules (separator lines)
          hr: ({ node, ...props }) => (
            <hr {...props} className='my-8 border-border' />
          ),
          // Style tables
          table: ({ node, ...props }) => (
            <div className='my-6 w-full overflow-y-auto'>
              <table {...props} className='w-full' />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              {...props}
              className='border px-4 py-2 text-left font-bold text-lg [&[align=center]]:text-center [&[align=right]]:text-right'
            />
          ),
          td: ({ node, ...props }) => (
            <td
              {...props}
              className='border px-4 py-2 text-left text-lg [&[align=center]]:text-center [&[align=right]]:text-right'
            />
          ),
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
