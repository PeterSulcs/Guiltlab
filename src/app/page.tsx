import Heatmap from "@/components/Heatmap";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <Heatmap />
        <Leaderboard />
      </div>
    </div>
  );
}
