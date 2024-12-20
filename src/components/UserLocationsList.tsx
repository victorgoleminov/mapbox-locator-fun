import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronUp, Users } from "lucide-react";

interface UserLocation {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
}

interface UserLocationsListProps {
  locations: UserLocation[];
  currentUserId?: string;
  isSharing: boolean;
  onStopSharing: () => void;
}

export const UserLocationsList = ({ 
  locations, 
  currentUserId,
  isSharing,
  onStopSharing 
}: UserLocationsListProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="secondary" 
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 shadow-lg flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          <span>{locations.length} Online</span>
          <ChevronUp className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-xl">
        <div className="space-y-4 mt-4">
          <h3 className="text-lg font-semibold">Nearby Users</h3>
          <div className="space-y-4">
            {locations.map((location) => {
              const isCurrentUser = location.id === currentUserId;
              const timeAgo = Math.round((Date.now() - location.timestamp) / 1000 / 60);
              
              return (
                <div key={location.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-12 w-12 border-2 border-primary">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {isCurrentUser ? 'You' : location.id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {isCurrentUser ? 'You' : `User ${location.id.slice(0, 8)}`}
                      </span>
                      {isCurrentUser && isSharing && (
                        <button 
                          onClick={onStopSharing}
                          className="text-destructive text-sm hover:text-destructive/80"
                        >
                          Stop Sharing
                        </button>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Last updated: {timeAgo} min ago
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};