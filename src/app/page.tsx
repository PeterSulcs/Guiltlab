import InstanceForm from "@/components/InstanceForm";
import InstanceList from "@/components/InstanceList";
import Heatmap from "@/components/Heatmap";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">GuiltLab</h1>
          <p className="text-blue-100">Aggregate your GitLab contributions across multiple instances</p>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <InstanceForm />
            <InstanceList />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <Heatmap />
            <Leaderboard />
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} GuiltLab - GitLab Heatmap Aggregator</p>
          <p className="text-gray-400 text-sm mt-1">
            Not affiliated with GitLab Inc.
          </p>
        </div>
      </footer>
    </main>
  );
}
