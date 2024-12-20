import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg w-[300px]">
      {locations.map((location) => {
        const isCurrentUser = location.id === currentUserId;
        const timeAgo = Math.round((Date.now() - location.timestamp) / 1000 / 60);
        
        return (
          <div key={location.id} className="flex items-center gap-3 py-2">
            <Avatar>
              <AvatarFallback>{isCurrentUser ? 'You' : location.id.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-medium">
                  {isCurrentUser ? 'You' : `User ${location.id.slice(0, 8)}`}
                </span>
                {isCurrentUser && isSharing && (
                  <button 
                    onClick={onStopSharing}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Stop Sharing
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {timeAgo} min ago
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};