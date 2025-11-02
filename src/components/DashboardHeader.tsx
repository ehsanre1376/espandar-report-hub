import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onHomeClick: () => void;
}

export const DashboardHeader = ({ onMenuClick, onHomeClick }: DashboardHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[hsl(var(--header-background))] border-b border-[hsl(var(--header-background))]/20 z-50 shadow-md">
      <div className="flex items-center justify-between h-full px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="text-[hsl(var(--header-foreground))] hover:bg-[hsl(var(--header-background))]/80"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <button 
            onClick={onHomeClick}
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src="/favicon.ico" 
              alt="Espandar Logo" 
              className="h-10 w-10 object-contain cursor-pointer"
            />
          </button>
        </div>
        <h1 className="text-xl font-semibold text-[hsl(var(--header-foreground))] tracking-wide">
          Espandar
        </h1>
      </div>
    </header>
  );
};
