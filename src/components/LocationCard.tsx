import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface LocationCardProps {
  latitude: number;
  longitude: number;
  loading?: boolean;
}

const LocationCard = ({ latitude, longitude, loading }: LocationCardProps) => {
  return (
    <Card className="absolute top-4 left-4 p-4 z-[1000] bg-white/90 backdrop-blur-sm w-[300px]">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold">Your Location</h3>
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Getting your location..."
            ) : (
              `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            )}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LocationCard;