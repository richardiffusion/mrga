import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ children, className }) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 自定义组件样式
          h1: ({ node, ...props }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-lg font-bold mt-3 mb-2 text-gray-800" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-base font-semibold mt-2 mb-1 text-gray-700" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-gray-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-700" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-purple-300 pl-3 py-1 my-2 text-gray-600 italic" {...props} />
          ),
          code: ({ node, inline, ...props }) => {
            if (inline) {
              return <code className="bg-gray-100 rounded px-1 py-0.5 text-sm font-mono" {...props} />;
            }
            return <code className="block bg-gray-100 rounded p-2 my-2 text-sm font-mono overflow-x-auto" {...props} />;
          },
          a: ({ node, ...props }) => (
            <a className="text-purple-600 hover:text-purple-800 underline" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}