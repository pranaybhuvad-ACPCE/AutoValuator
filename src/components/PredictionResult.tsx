import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, TrendingUp } from "lucide-react";

interface Props {
  price: number | null;
}

export function PredictionResult({ price }: Props) {
  if (price === null) return null;

  // Calculate realistic price range (±10% for prediction uncertainty)
  const lowPrice = price * 0.9;
  const highPrice = price * 1.1;

  const formatPrice = (p: number) => {
    if (p >= 100) {
      return `${(p / 100).toFixed(1)}Cr`;
    }
    return `${p.toFixed(1)}L`;
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardContent className="flex flex-col gap-3 py-6 px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estimated Market Value</p>
            <div className="flex items-center gap-1 text-3xl font-bold text-foreground">
              <IndianRupee className="h-6 w-6" />
              {formatPrice(lowPrice)} <span className="text-muted-foreground font-normal mx-1">–</span> {formatPrice(highPrice)}
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit text-xs">
          Estimated range based on similar listings
        </Badge>
      </CardContent>
    </Card>
  );
}
