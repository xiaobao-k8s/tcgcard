import { getCardById, loadCards } from "@/lib/cards";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: { cardId: string };
}

export function generateStaticParams(): { cardId: string }[] {
  return loadCards().map((card) => ({ cardId: card.id }));
}

export default function CardDetailPage({ params }: PageProps) {
  const card = getCardById(params.cardId);
  if (!card) notFound();

  return (
    <div className="min-h-screen bg-bg-warm">
      <header className="bg-primary text-white py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-sm hover:underline">
            &larr; 返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-card-bg rounded-2xl p-8 border-2 border-border">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <span className="text-5xl">
                {card.attribute === "火" ? "🔥" : card.attribute === "草" ? "🌿" : card.attribute === "水" ? "💧" : "✨"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              {card.name.zh}
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              {card.name.ja}
            </p>
            <p className="text-text-secondary text-xs mt-1">
              {card.number}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-bg-warm rounded-lg p-3">
              <p className="text-xs text-text-secondary">属性</p>
              <p className="font-medium text-text-primary">{card.attribute}</p>
            </div>
            <div className="bg-bg-warm rounded-lg p-3">
              <p className="text-xs text-text-secondary">稀有度</p>
              <p className="font-medium text-text-primary capitalize">{card.rarity}</p>
            </div>
            <div className="bg-bg-warm rounded-lg p-3">
              <p className="text-xs text-text-secondary">进化阶段</p>
              <p className="font-medium text-text-primary">{card.evolution_stage}</p>
            </div>
            <div className="bg-bg-warm rounded-lg p-3">
              <p className="text-xs text-text-secondary">效果类型</p>
              <p className="font-medium text-text-primary">{card.effect_type}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              卡片背面数据
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{card.back.dp_attack}</p>
                <p className="text-xs text-text-secondary mt-1">攻击</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{card.back.dp_defense}</p>
                <p className="text-xs text-text-secondary mt-1">防御</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{card.back.dp_speed ?? "-"}</p>
                <p className="text-xs text-text-secondary mt-1">速度</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{card.back.skill}</p>
                <p className="text-xs text-text-secondary mt-1">技能</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-text-secondary text-center italic">
              &ldquo;{card.back.description}&rdquo;
            </p>
            <div className="mt-2 text-center text-xs text-text-secondary">
              <span>身高: {card.back.height}</span>
              <span className="mx-2">|</span>
              <span>体重: {card.back.weight}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
