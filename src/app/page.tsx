import { loadCards, getAttributes, getRarities } from '@/lib/cards';
import HomePage from '@/components/HomePage';

export default function Home() {
  const allCards = loadCards();
  const allAttributes = getAttributes();
  const allRarities = getRarities();

  return (
    <HomePage
      cards={allCards}
      attributes={allAttributes}
      rarities={allRarities}
    />
  );
}
