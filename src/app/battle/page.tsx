import { loadCards } from '@/lib/cards';
import BattleSimulator from '@/components/BattleSimulator';

export const metadata = {
  title: '模拟对战 - 童年神奇卡片百科',
  description: '课间 DP 对战模拟器，选卡比攻防，重温童年对决',
};

export default function BattlePage() {
  const cards = loadCards();

  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">⚔️ 模拟对战</h1>
          <p className="text-sm text-white/70 mt-1">选择两张卡片，逐轮比较 DP 数值，重温课间对战</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <BattleSimulator allCards={cards} />
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>童年神奇卡片百科 &copy; 2026 · 模拟对战</p>
      </footer>
    </div>
  );
}
