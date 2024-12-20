import { Map } from "@/components/Map";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export default function Index() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="h-screen w-screen relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-4 right-4 z-10"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>
      <Map />
    </div>
  );
}