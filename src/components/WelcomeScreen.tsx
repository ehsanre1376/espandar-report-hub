import { BarChart3, TrendingUp, Users, Package } from "lucide-react";

export const WelcomeScreen = () => {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted/30">
      <div className="text-center space-y-8 px-6 max-w-2xl">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-foreground">
            Welcome to Espandar BI Portal
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a report from the sidebar to view detailed analytics and insights
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
            <BarChart3 className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm font-medium">Financial</p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
            <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm font-medium">Sales</p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
            <Users className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm font-medium">HR</p>
          </div>
          <div className="p-6 bg-card rounded-lg border border-border hover:border-accent transition-colors">
            <Package className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm font-medium">Inventory</p>
          </div>
        </div>
      </div>
    </div>
  );
};
