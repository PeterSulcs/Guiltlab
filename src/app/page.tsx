import Heatmap from "@/components/Heatmap";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  return (
    <div className="py-6 px-4 w-full overflow-hidden">
      <div className="space-y-6">
        <Heatmap />
        <Leaderboard />
      </div>
    </div>
  );
}
