import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Database, Target } from "lucide-react";
import trainedModel from "@/data/trainedModel.json";

export function ModelInfoCard() {
  const M = trainedModel as typeof trainedModel;
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Powered by a Trained ML Model
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Algorithm" value={M.algorithm} />
          <Stat label="Dataset" value={`${M.datasetRows} rows`} icon={<Database className="h-3 w-3" />} />
          <Stat label="R² Score" value={M.metrics.r2.toFixed(3)} icon={<Target className="h-3 w-3" />} />
          <Stat label="MAE" value={`₹${M.metrics.mae.toFixed(2)}L`} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Top influencing features</p>
          <div className="flex flex-wrap gap-1.5">
            {M.topFeatures.map((f) => (
              <Badge key={f.name} variant="secondary" className="text-[11px] font-normal">
                {f.name.replace(/_/g, " ")} <span className="ml-1 text-muted-foreground">({f.coefficient > 0 ? "+" : ""}{f.coefficient.toFixed(2)})</span>
              </Badge>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Trained on the CarDekho dataset using Linear Regression. RMSE: ₹{M.metrics.rmse.toFixed(2)}L · Trained {M.trainedAt}.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <div className="text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
        {icon}{label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
