import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onHomeClick: () => void;
  isVisible: boolean;
}

export const DashboardHeader = ({ onMenuClick, onHomeClick, isVisible }: DashboardHeaderProps) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 h-12 bg-[hsl(var(--header-background))] border-b border-[hsl(var(--header-background))]/20 z-50 shadow-md transition-transform duration-300",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
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
              className="h-8 w-8 object-contain cursor-pointer"
            />
          </button>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-[hsl(var(--header-foreground))]/80">
              {(user.email || user.username || "").split("@")[0]}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-[hsl(var(--header-foreground))] hover:bg-[hsl(var(--header-background))]/80"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
