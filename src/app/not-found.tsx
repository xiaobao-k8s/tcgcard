'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4">
      {/* Big 404 with orange theme */}
      <div className="text-center">
        <h1 className="text-8xl sm:text-9xl font-black text-primary/20 select-none">
          404
        </h1>
        <div className="-mt-6 text-5xl sm:text-6xl" role="img" aria-label="confused">
          🤔
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
        卡片没有找到
      </h2>

      <p className="text-text-secondary text-center max-w-md">
        这张卡片好像不存在于图鉴中，也许它还在训练师的世界里隐藏着。
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <Link
          href="/"
          className="
            px-6 py-3 rounded-full
            bg-primary text-white font-medium text-sm
            shadow-md hover:shadow-lg hover:bg-primary/90
            transition-all duration-200
          "
        >
          返回图鉴首页
        </Link>
        <button
          onClick={() => window.history.back()}
          className="
            px-6 py-3 rounded-full
            bg-card-bg text-text-primary font-medium text-sm
            border-2 border-border hover:border-primary/40
            transition-all duration-200
          "
        >
          返回上一页
        </button>
      </div>
    </div>
  );
}
