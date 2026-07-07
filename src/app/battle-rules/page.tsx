import Link from 'next/link';

export default function BattleRulesPage() {
  return (
    <div className="min-h-screen bg-bg-warm">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-6 px-4 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-sm mb-2 opacity-80">
            <Link href="/" className="hover:underline hover:opacity-100 transition-opacity">
              图鉴
            </Link>
            <span className="opacity-50">/</span>
            <span className="font-medium">对战规则</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">DP 对战规则</h1>
          <p className="text-sm text-white/70 mt-1">还原课间 DP 对战，重温操场上的精灵决斗</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        {/* Battle flow overview */}
        <section className="bg-card-bg rounded-2xl border-2 border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">对战流程</h2>
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-4 py-6">
            <BattleStep emoji="🤝" label="双方各出一张卡" />
            <BattleArrow />
            <BattleStep emoji="⚔️" label="比较攻击力 ATK" />
            <BattleArrow />
            <BattleStep emoji="🛡️" label="比较防御力 DEF" />
            <BattleArrow />
            <BattleStep emoji="🏆" label="三局两胜" />
          </div>
          <p className="text-center text-sm text-text-secondary">
            双方各出一张精灵卡，依次比较攻击力、防御力（二代增加速度），三局两胜制
          </p>
        </section>

        {/* Gen 1 rules */}
        <section className="bg-card-bg rounded-2xl border-2 border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            <span className="inline-block w-8 h-8 bg-primary text-white rounded-full text-center leading-8 text-sm mr-2">一</span>
            一代 · 旋风卡对战规则
          </h2>

          <div className="space-y-4 text-sm text-text-secondary">
            <RuleItem
              number="1"
              title="出卡"
              description="双方同时翻开一张卡片，正面朝上放在桌面上。"
            />
            <RuleItem
              number="2"
              title="第一轮：比攻击"
              description="攻击力高的一方得 1 分。攻击力相同时，比较防御力。"
            />
            <RuleItem
              number="3"
              title="第二轮：比防御"
              description="防御力高的一方得 1 分。防御力也相同时，平局。"
            />
            <RuleItem
              number="4"
              title="决胜"
              description="先获得 2 分的一方获胜。若两轮后平局（1:1），则再比一轮攻击。"
            />
          </div>

          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-text-primary mb-3">一代案例：小火龙 vs 妙蛙种子（假设跨代对战）</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <p className="font-bold text-text-primary">小火龙</p>
                <p className="text-lg font-bold text-rare-glow mt-1">ATK 50</p>
                <p className="text-lg font-bold text-legendary-glow">DEF 40</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="font-bold text-text-primary">妙蛙种子</p>
                <p className="text-lg font-bold text-primary mt-1">ATK 45</p>
                <p className="text-lg font-bold text-legendary-glow">DEF 55</p>
              </div>
            </div>
            <div className="mt-3 text-center text-sm">
              <p className="text-text-primary font-medium">
                第一轮（攻击）：小火龙 50 &gt; 45 → <span className="text-primary">小火龙得 1 分</span>
              </p>
              <p className="text-text-primary font-medium mt-1">
                第二轮（防御）：小火龙 40 &lt; 55 → <span className="text-primary">妙蛙种子得 1 分</span>
              </p>
              <p className="text-text-primary font-medium mt-2">
                比分 1:1，平局！进入加赛轮。
              </p>
            </div>
          </div>
        </section>

        {/* Gen 2 rules */}
        <section className="bg-card-bg rounded-2xl border-2 border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">
            <span className="inline-block w-8 h-8 bg-rare-glow text-white rounded-full text-center leading-8 text-sm mr-2">二</span>
            二代 · 进化比斗卡对战规则
          </h2>

          <div className="space-y-4 text-sm text-text-secondary">
            <RuleItem
              number="1"
              title="出卡"
              description="双方同时翻开一张方形卡片。部分精灵支持三变效果（常态 → 蓄力 → 大招）。"
            />
            <RuleItem
              number="2"
              title="第一轮：比攻击"
              description="攻击力高的一方得 1 分。"
            />
            <RuleItem
              number="3"
              title="第二轮：比防御"
              description="防御力高的一方得 1 分。"
            />
            <RuleItem
              number="4"
              title="第三轮：比速度（新增！）"
              description="二代新增速度属性（DP Speed），速度高的一方得 1 分。"
            />
            <RuleItem
              number="5"
              title="决胜"
              description="三轮中得分多者获胜。2:0 或 2:1 均可获胜。若三轮全平则重赛。"
            />
          </div>

          <div className="mt-4 p-3 bg-red-50 rounded-xl border border-rare-glow/30">
            <p className="text-sm font-medium text-rare-glow">
              ⚡ 二代新增：速度属性（DP Speed），让对战更有策略性！
            </p>
          </div>

          <div className="mt-6 p-4 bg-red-50 rounded-xl border border-border">
            <h3 className="text-sm font-bold text-text-primary mb-3">二代案例：小火龙 vs 妙蛙种子</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg">
                <p className="font-bold text-text-primary">小火龙</p>
                <p className="text-lg font-bold text-rare-glow mt-1">ATK 50</p>
                <p className="text-lg font-bold text-legendary-glow">DEF 40</p>
                <p className="text-lg font-bold text-primary">SPD 50</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="font-bold text-text-primary">妙蛙种子</p>
                <p className="text-lg font-bold text-primary mt-1">ATK 45</p>
                <p className="text-lg font-bold text-legendary-glow">DEF 55</p>
                <p className="text-lg font-bold text-primary">SPD 45</p>
              </div>
            </div>
            <div className="mt-3 text-center text-sm">
              <p className="text-text-primary font-medium">
                第一轮（攻击）：50 &gt; 45 → <span className="text-rare-glow">小火龙 1 分</span>
              </p>
              <p className="text-text-primary font-medium mt-1">
                第二轮（防御）：40 &lt; 55 → <span className="text-rare-glow">妙蛙种子 1 分</span>
              </p>
              <p className="text-text-primary font-medium mt-1">
                第三轮（速度）：50 &gt; 45 → <span className="text-rare-glow">小火龙 1 分</span>
              </p>
              <p className="text-text-primary font-medium mt-2">
                最终比分 2:1 → <span className="font-bold text-text-primary">小火龙获胜！</span>
              </p>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="bg-card-bg rounded-2xl border-2 border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">一代 vs 二代对战规则对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left py-3 px-4 text-text-primary">对比项</th>
                  <th className="text-center py-3 px-4 text-primary">一代 · 旋风卡</th>
                  <th className="text-center py-3 px-4 text-rare-glow">二代 · 比斗卡</th>
                </tr>
              </thead>
              <tbody className="text-text-secondary">
                <ComparisonRow
                  feature="卡片形状"
                  gen1="圆形（直径约 4cm）"
                  gen2="方形"
                />
                <ComparisonRow
                  feature="比较轮数"
                  gen1="2 轮（攻击 + 防御）"
                  gen2="3 轮（攻击 + 防御 + 速度）"
                />
                <ComparisonRow
                  feature="速度属性"
                  gen1="无"
                  gen2="有（DP Speed）"
                />
                <ComparisonRow
                  feature="变身效果"
                  gen1="双变（进化前 / 后）"
                  gen2="部分三变（常态 → 蓄力 → 大招）"
                />
                <ComparisonRow
                  feature="获胜条件"
                  gen1="先得 2 分（可能加赛）"
                  gen2="3 局 2 胜"
                />
                <ComparisonRow
                  feature="精灵数量"
                  gen1="56 张"
                  gen2="93 张（90 精灵 + 3 人物）"
                />
              </tbody>
            </table>
          </div>
        </section>

        {/* Bonus: Card flipping game */}
        <section className="bg-card-bg rounded-2xl border-2 border-border p-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">拍卡玩法</h2>
          <div className="space-y-3 text-sm text-text-secondary">
            <p>
              除了正式的 DP 对战，课间还有另一种流行玩法——<strong className="text-text-primary">拍卡</strong>（又称 &ldquo;Pog&rdquo;）。
            </p>
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="font-medium text-text-primary mb-2">拍卡规则：</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>双方各放 1-3 张卡片在地上，正面朝上叠放。</li>
                <li>轮流用手掌拍击地面，利用气流吹翻卡片。</li>
                <li>吹翻的卡片归拍卡者所有。</li>
                <li>拍完为止，剩余卡片放回原主。</li>
              </ol>
            </div>
            <p>
              传说级的神兽卡（快龙、喷火龙等）一般舍不得拿来拍卡，但偶尔有 &ldquo;土豪&rdquo; 会用它来炫耀——
              这时候围观的人就多了。
            </p>
          </div>
        </section>
      </main>

      <footer className="text-center py-8 text-text-secondary text-sm border-t border-border mt-8">
        <p>奇多卡片百科 &copy; 2026 &middot; DP 对战规则</p>
      </footer>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function BattleStep({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-sm border border-border min-w-[100px] sm:min-w-[130px]">
      <span className="text-2xl sm:text-3xl" role="img" aria-hidden="true">{emoji}</span>
      <p className="text-xs sm:text-sm font-medium text-text-primary text-center">{label}</p>
    </div>
  );
}

function BattleArrow() {
  return (
    <span className="text-primary text-xl sm:text-2xl font-bold select-none animate-pulse" aria-hidden="true">
      &#8594;
    </span>
  );
}

function RuleItem({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-7 h-7 bg-primary text-white rounded-full text-center leading-7 text-xs font-bold">
        {number}
      </span>
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

function ComparisonRow({ feature, gen1, gen2 }: { feature: string; gen1: string; gen2: string }) {
  return (
    <tr className="border-b border-border hover:bg-orange-50/50 transition-colors">
      <td className="py-3 px-4 font-medium text-text-primary">{feature}</td>
      <td className="py-3 px-4 text-center">{gen1}</td>
      <td className="py-3 px-4 text-center">{gen2}</td>
    </tr>
  );
}
