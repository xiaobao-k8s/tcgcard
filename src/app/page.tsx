import { loadCards } from "@/lib/cards";
import Link from "next/link";

export default function Home() {
  const cards = loadCards();

  return (
    <div className="min-h-screen bg-bg-warm">
      <header className="bg-primary text-white py-6 px-4 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center">
            奇多卡片百科
          </h1>
          <p className="text-center mt-2 text-sm opacity-90">
            旋风卡图鉴 — 怀旧宝可梦卡片收藏
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          收录卡片 ({cards.length} 张)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/${card.id}`}
              className="bg-card-bg rounded-2xl p-4 text-center border-2 border-border hover:border-primary hover:shadow-lg transition-all duration-200"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <span className="text-2xl">
                  {card.attribute === "火" ? "🔥" : card.attribute === "草" ? "🌿" : card.attribute === "水" ? "💧" : "✨"}
                </span>
              </div>
              <p className="font-medium text-text-primary truncate">
                {card.name.zh}
              </p>
              <p className="text-xs text-text-secondary mt-1">
                {card.number}
              </p>
              <span
                className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  card.rarity === "legendary"
                    ? "bg-legendary-glow/20 text-legendary-glow"
                    : card.rarity === "ultra-rare"
                      ? "bg-rare-glow/20 text-rare-glow"
                      : card.rarity === "rare"
                        ? "bg-primary/20 text-primary"
                        : "bg-gray-200 text-gray-600"
                }`}
              >
                {card.rarity}
              </span>
            </Link>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm">
        <p>奇多卡片百科 &copy; 2026</p>
      </footer>
    </div>
  );
}
