import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import espandarLogo from "@/assets/espandar-logo.png";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary border-b border-primary/20 z-50 shadow-md">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-primary-foreground hover:bg-primary/80 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src={espandarLogo} 
            alt="Espandar Logo" 
            className="h-10 object-contain"
          />
        </div>
        <h1 className="text-xl font-semibold text-primary-foreground tracking-wide">
          Espandar
        </h1>
      </div>
    </header>
  );
};
