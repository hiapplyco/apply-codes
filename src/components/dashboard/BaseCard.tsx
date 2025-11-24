
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseCardProps } from "./types";

const sizeClasses = {
  "1x1": "col-span-1 row-span-1",
  "1x2": "col-span-1 row-span-2",
  "2x1": "col-span-2 row-span-1",
  "2x2": "col-span-2 row-span-2",
};

export function BaseCard({ title, children, size, onExpand, onPin, className }: BaseCardProps) {
  // Generate a random small rotation for the post-it effect
  const randomRotation = (Math.random() * 2 - 1).toFixed(1);

  return (
    <Card className={cn(
      "transition-all duration-300 transform hover:-translate-y-1 hover:rotate-0",
      "shadow-[5px_5px_10px_rgba(0,0,0,0.15)]",
      sizeClasses[size],
      className
    )}
    style={{
      transformOrigin: 'center center',
      transform: `rotate(${randomRotation}deg)`
    }}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {onPin && (
            <Button variant="ghost" size="icon" onClick={onPin}>
              <Pin className="h-4 w-4" />
            </Button>
          )}
          {onExpand && (
            <Button variant="ghost" size="icon" onClick={onExpand}>
              <Expand className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}
