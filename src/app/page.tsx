import InstanceForm from "@/components/InstanceForm";
import InstanceList from "@/components/InstanceList";
import GitHubInstanceForm from "@/components/GitHubInstanceForm";
import GitHubInstanceList from "@/components/GitHubInstanceList";
import Heatmap from "@/components/Heatmap";
import Leaderboard from "@/components/Leaderboard";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">GuiltLab</h1>
          <p className="opacity-80">Aggregate your GitLab and GitHub contributions across multiple instances</p>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <InstanceForm />
            <InstanceList />
            <GitHubInstanceForm />
            <GitHubInstanceList />
          </div>
          
          <div className="md:col-span-2 space-y-6">
            <Heatmap />
            <Leaderboard />
          </div>
        </div>
      </div>
      
      <footer className="bg-muted text-muted-foreground p-6 mt-8">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} GuiltLab - GitLab & GitHub Heatmap Aggregator</p>
          <p className="opacity-70 text-sm mt-1">
            Not affiliated with GitLab Inc. or GitHub Inc.
          </p>
        </div>
      </footer>
      
      <ThemeToggle />
    </main>
  );
}
