import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, Cell } from "recharts";
import { mockCarData } from "@/data/mockCarData";
import { BarChart3, TrendingUp, Fuel } from "lucide-react";

const COLORS = [
  "hsl(210, 100%, 45%)",
  "hsl(160, 70%, 40%)",
  "hsl(35, 95%, 55%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 75%, 55%)",
];

export function EDACharts() {
  const priceByYear = useMemo(() => {
    const map: Record<number, { total: number; count: number }> = {};
    mockCarData.forEach(d => {
      if (!map[d.year]) map[d.year] = { total: 0, count: 0 };
      map[d.year].total += d.sellingPrice;
      map[d.year].count++;
    });
    return Object.entries(map)
      .map(([year, v]) => ({ year: +year, avgPrice: Math.round((v.total / v.count) * 100) / 100 }))
      .sort((a, b) => a.year - b.year);
  }, []);

  const priceByBrand = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    mockCarData.forEach(d => {
      if (!map[d.brand]) map[d.brand] = { total: 0, count: 0 };
      map[d.brand].total += d.sellingPrice;
      map[d.brand].count++;
    });
    return Object.entries(map)
      .map(([brand, v]) => ({ brand, avgPrice: Math.round((v.total / v.count) * 100) / 100 }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }, []);

  const priceByFuel = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    mockCarData.forEach(d => {
      if (!map[d.fuelType]) map[d.fuelType] = { total: 0, count: 0 };
      map[d.fuelType].total += d.sellingPrice;
      map[d.fuelType].count++;
    });
    return Object.entries(map)
      .map(([fuel, v]) => ({ fuel, avgPrice: Math.round((v.total / v.count) * 100) / 100 }))
      .sort((a, b) => b.avgPrice - a.avgPrice);
  }, []);

  const scatterData = useMemo(() => {
    return mockCarData.slice(0, 200).map(d => ({
      kmsDriven: d.kmsDriven,
      sellingPrice: d.sellingPrice,
    }));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-primary" />
            Avg Price by Year
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={priceByYear}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="year" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={v => `₹${v}L`} />
              <Tooltip formatter={(v: number) => [`₹${v} Lakhs`, 'Avg Price']} />
              <Line type="monotone" dataKey="avgPrice" stroke="hsl(210,100%,45%)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Avg Price by Brand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceByBrand} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis type="number" fontSize={11} tickFormatter={v => `₹${v}L`} />
              <YAxis dataKey="brand" type="category" fontSize={11} width={80} />
              <Tooltip formatter={(v: number) => [`₹${v} Lakhs`, 'Avg Price']} />
              <Bar dataKey="avgPrice" radius={[0, 4, 4, 0]}>
                {priceByBrand.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fuel className="h-4 w-4 text-primary" />
            Avg Price by Fuel Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceByFuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="fuel" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={v => `₹${v}L`} />
              <Tooltip formatter={(v: number) => [`₹${v} Lakhs`, 'Avg Price']} />
              <Bar dataKey="avgPrice" radius={[4, 4, 0, 0]}>
                {priceByFuel.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Mileage vs Price
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,90%)" />
              <XAxis dataKey="kmsDriven" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} name="Kms" />
              <YAxis dataKey="sellingPrice" fontSize={11} tickFormatter={v => `₹${v}L`} name="Price" />
              <Tooltip formatter={(v: number, name: string) => [name === 'Kms' ? `${v.toLocaleString()} km` : `₹${v} Lakhs`, name]} />
              <Scatter data={scatterData} fill="hsl(210,100%,45%)" fillOpacity={0.5} r={3} />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
