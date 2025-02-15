'use client';

import PredictionMarket from '@/components/prediction-market/PredictionMarket';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <PredictionMarket />
    </main>
  );
}

// import PredictionMarketTest from '@/components/prediction-market-test/PredictionMarketTest';

// export default function Home() {
//   return (
//     <main className="min-h-screen bg-gray-50">
//       <PredictionMarketTest />
//     </main>
//   );
// }