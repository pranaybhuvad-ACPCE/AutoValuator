import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchPredictedPrice, predictPriceLocal } from "@/lib/predictPrice";
import { modelDetails, getModelBodyType } from "@/data/carDetails";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthNavigation } from "@/components/AuthNavigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Car, Fuel, Gauge, Calendar, Settings, IndianRupee, TrendingUp, TrendingDown, Minus, Info, Shield, Zap, Activity, Users, Package, Mountain, Droplets, Rocket, HelpCircle } from "lucide-react";


import hatchbackImg from "@/assets/car-hatchback.jpg";
import sedanImg from "@/assets/car-sedan.jpg";
import suvImg from "@/assets/car-suv.jpg";
import luxuryImg from "@/assets/car-luxury.jpg";
import pickupImg from "@/assets/car-pickup.jpg";
import mpvImg from "@/assets/car-mpv.jpg";

// Model-specific images
import swiftImg from "@/assets/cars/swift.jpg";
import cretaImg from "@/assets/cars/creta.jpg";
import nexonImg from "@/assets/cars/nexon.jpg";
import fortunerImg from "@/assets/cars/fortuner.jpg";
import cityImg from "@/assets/cars/city.jpg";
import seltosImg from "@/assets/cars/seltos.jpg";
import tharImg from "@/assets/cars/thar.jpg";
import xuv700Img from "@/assets/cars/xuv700.jpg";
import balenoImg from "@/assets/cars/baleno.jpg";
import innovaImg from "@/assets/cars/innova.jpg";
import vernaImg from "@/assets/cars/verna.jpg";
import poloImg from "@/assets/cars/polo.jpg";
import i20Img from "@/assets/cars/i20.jpg";
import scorpioImg from "@/assets/cars/scorpio.jpg";
import harrierImg from "@/assets/cars/harrier.jpg";
import dzireImg from "@/assets/cars/dzire.jpg";
import wagonrImg from "@/assets/cars/wagonr.jpg";
import brezzaImg from "@/assets/cars/brezza.jpg";
import ertigaImg from "@/assets/cars/ertiga.jpg";
import punchImg from "@/assets/cars/punch.jpg";
import sonetImg from "@/assets/cars/sonet.jpg";
import bmw3Img from "@/assets/cars/bmw3.jpg";
import cclassImg from "@/assets/cars/cclass.jpg";
import hectorImg from "@/assets/cars/hector.jpg";
import ecosportImg from "@/assets/cars/ecosport.jpg";
import alcazarImg from "@/assets/cars/alcazar.jpg";
import exterImg from "@/assets/cars/exter.jpg";
import santroImg from "@/assets/cars/santro.jpg";
import i10Img from "@/assets/cars/i10.jpg";
import tucsonImg from "@/assets/cars/tucson.jpg";
import venueImg from "@/assets/cars/venue.jpg";

const modelImages: Record<string, string> = {
  Swift: swiftImg,
  Creta: cretaImg,
  Nexon: nexonImg,
  Fortuner: fortunerImg,
  City: cityImg,
  Seltos: seltosImg,
  Thar: tharImg,
  XUV700: xuv700Img,
  Baleno: balenoImg,
  Innova: innovaImg,
  "Innova Hycross": innovaImg,
  Verna: vernaImg,
  Polo: poloImg,
  i20: i20Img,
  "Scorpio-N": scorpioImg,
  Scorpio: scorpioImg,
  Harrier: harrierImg,
  Dzire: dzireImg,
  "Wagon R": wagonrImg,
  WagonR: wagonrImg,
  "Vitara Brezza": brezzaImg,
  Brezza: brezzaImg,
  Ertiga: ertigaImg,
  Punch: punchImg,
  Sonet: sonetImg,
  "3 Series": bmw3Img,
  "5 Series": bmw3Img,
  "C-Class": cclassImg,
  "E-Class": cclassImg,
  Hector: hectorImg,
  "Hector Plus": hectorImg,
  EcoSport: ecosportImg,
  Alcazar: alcazarImg,
  Exter: exterImg,
  Santro: santroImg,
  i10: i10Img,
  Tucson: tucsonImg,
  Venue: venueImg,
};

const bodyTypeImages: Record<string, string> = {
  hatchback: hatchbackImg,
  sedan: sedanImg,
  suv: suvImg,
  luxury: luxuryImg,
  pickup: pickupImg,
  mpv: mpvImg,
};

function getCarImage(model: string): string {
  if (modelImages[model]) return modelImages[model];
  const bodyType = getModelBodyType(model);
  return bodyTypeImages[bodyType] || sedanImg;
}

const brandInfo: Record<string, { founded: string; origin: string; description: string }> = {
  Toyota: { founded: "1937", origin: "Japan", description: "Toyota is the world's largest automobile manufacturer, known for reliability, fuel efficiency, and strong resale value. Popular models in India include the Innova and Fortuner." },
  Honda: { founded: "1948", origin: "Japan", description: "Honda is renowned for its engineering excellence and fuel-efficient engines. The Honda City has been one of India's best-selling sedans for decades." },
  Hyundai: { founded: "1967", origin: "South Korea", description: "Hyundai is India's second-largest car manufacturer, known for feature-rich, stylish vehicles at competitive prices. The Creta is one of India's top-selling SUVs." },
  Maruti: { founded: "1981", origin: "India (Suzuki JV)", description: "Maruti Suzuki dominates the Indian market with nearly 40% market share. Known for affordable, fuel-efficient cars with excellent service network coverage." },
  Ford: { founded: "1903", origin: "USA", description: "Ford was popular in India for the EcoSport and Endeavour before exiting manufacturing in 2021. Used Ford vehicles remain sought after for their build quality." },
  BMW: { founded: "1916", origin: "Germany", description: "BMW is a leading luxury car brand known for its sporty driving dynamics and premium interiors. The 3 Series and X1 are popular choices in India." },
  Audi: { founded: "1909", origin: "Germany", description: "Audi stands for 'Vorsprung durch Technik' (Advancement through Technology). Known for Quattro AWD and refined luxury." },
  Mercedes: { founded: "1926", origin: "Germany", description: "Mercedes-Benz is the world's oldest automobile brand, synonymous with luxury, comfort, and cutting-edge technology." },
  Volkswagen: { founded: "1937", origin: "Germany", description: "Volkswagen brings German engineering to the mass market. Known for solid build quality and turbocharged TSI engines." },
  Kia: { founded: "1944", origin: "South Korea", description: "Kia entered India in 2019 and quickly became a top seller with the Seltos. Known for bold design and feature-loaded cars." },
  Tata: { founded: "1945", origin: "India", description: "Tata Motors is India's homegrown automotive giant. Known for safety-focused vehicles with 5-star GNCAP ratings." },
  Mahindra: { founded: "1945", origin: "India", description: "Mahindra is known for rugged SUVs and utility vehicles. The Thar, XUV700, and Scorpio-N have a massive fan following." },
  Skoda: { founded: "1895", origin: "Czech Republic", description: "Skoda offers European build quality at relatively accessible prices. Known for spacious interiors and turbocharged engines." },
  Renault: { founded: "1899", origin: "France", description: "Renault focuses on affordable, value-for-money vehicles in India. The Kwid and Kiger offer entry-level motoring with modern features." },
  Nissan: { founded: "1933", origin: "Japan", description: "Nissan's Magnite has been a game-changer in the sub-4m SUV segment with aggressive pricing and turbo engine option." },
  MG: { founded: "1924", origin: "UK (SAIC China)", description: "MG Motor entered India with feature-loaded vehicles. The Hector was India's first internet car." },
  Jeep: { founded: "1941", origin: "USA", description: "Jeep is an iconic off-road brand. The Compass brought accessible premium SUV motoring to India." },
  Citroen: { founded: "1919", origin: "France", description: "Citroën entered India with a focus on comfort and unique design. The C3 offers French flair at an affordable price point." },
  Volvo: { founded: "1927", origin: "Sweden", description: "Volvo is synonymous with safety and Scandinavian luxury. All Volvo cars come with advanced safety features as standard." },
  "Land Rover": { founded: "1948", origin: "UK", description: "Land Rover is the ultimate luxury off-road brand. The Range Rover is a status symbol worldwide." },
  Jaguar: { founded: "1922", origin: "UK", description: "Jaguar represents British luxury and sportiness. Known for elegant design and powerful engines." },
  Lexus: { founded: "1989", origin: "Japan", description: "Lexus is Toyota's luxury division, offering exceptional reliability with premium features and hybrid powertrains." },
  Porsche: { founded: "1931", origin: "Germany", description: "Porsche is the benchmark for sports car performance. The 911 is an icon of automotive engineering." },
  Mini: { founded: "1959", origin: "UK (BMW Group)", description: "Mini brings go-kart-like handling and iconic British design. A style statement on wheels." },
  Isuzu: { founded: "1916", origin: "Japan", description: "Isuzu specializes in pickup trucks and SUVs. The D-Max V-Cross is India's most popular lifestyle pickup truck." },
};

const CarResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const brand = searchParams.get("brand") || "Toyota";
  const model = searchParams.get("model") || "";
  const year = parseInt(searchParams.get("year") || "2020");
  const kmsDriven = parseInt(searchParams.get("kms") || "0");
  const fuelType = searchParams.get("fuel") || "Petrol";
  const transmission = searchParams.get("transmission") || "Manual";
  const engineSize = parseFloat(searchParams.get("engine") || "1.5");

  const [price, setPrice] = useState<number>(() => predictPriceLocal({ year, kmsDriven, fuelType, transmission, carName: model }).predictedPrice);
  const [predicting, setPredicting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPredicting(true);
    fetchPredictedPrice({ year, kmsDriven, fuelType, transmission, carName: model })
      .then((res) => { if (!cancelled) setPrice(res.predictedPrice); })
      .catch(() => { /* keep local fallback */ })
      .finally(() => { if (!cancelled) setPredicting(false); });
    return () => { cancelled = true; };
  }, [year, kmsDriven, fuelType, transmission, model]);

  const info = brandInfo[brand] || { founded: "N/A", origin: "N/A", description: "Information not available." };
  const carAge = new Date().getFullYear() - year;
  const baseDetails = modelDetails[model];
  const details = baseDetails
    ? adjustSpecsForVariant(baseDetails, { fuelType, engineSize, transmission, kmsDriven, carAge })
    : undefined;
  const bodyType = getModelBodyType(model);
  const carImage = getCarImage(model);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="container mx-auto flex items-center justify-between gap-2 py-3 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="rounded-lg bg-primary p-2">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AutoValuator</h1>
              <p className="text-xs text-muted-foreground">Price Estimate</p>
            </div>
            <AuthNavigation />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        {/* Car Image & Title */}
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <div className="relative">
            <img
              src={carImage}
              alt={`${brand} ${model}`}
              className="w-full h-52 sm:h-64 object-cover"
              width={800}
              height={512}
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                {bodyType.charAt(0).toUpperCase() + bodyType.slice(1)}
              </Badge>
              {details?.safetyRating && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Shield className="h-3 w-3 mr-1" /> {details.safetyRating}
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-2xl font-bold text-foreground">
              {year} {brand} {model}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {fuelType} · {transmission} · {engineSize}L · {kmsDriven.toLocaleString()} km driven
            </p>
          </div>
        </div>

        {/* Predicted Price */}
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
                  {(price * 0.95).toFixed(1)}L <span className="text-muted-foreground font-normal mx-1">–</span> {(price * 1.05).toFixed(1)}L
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit text-xs">
              Estimated range based on similar listings
            </Badge>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        {details && (
          <div className="grid grid-cols-4 gap-3">
            <QuickStat icon={<Zap className="h-4 w-4" />} label="Power" value={details.power} />
            <QuickStat icon={<Fuel className="h-4 w-4" />} label="Mileage" value={details.mileage} />
            <QuickStat icon={<Users className="h-4 w-4" />} label="Seats" value={details.seating.toString()} />
            <QuickStat icon={<Shield className="h-4 w-4" />} label="Safety" value={details.safetyRating} />
          </div>
        )}

        {/* Detailed Specifications */}
        {details && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Detailed Specifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SpecItem icon={<Zap className="h-4 w-4" />} label="Power" value={details.power} />
                <SpecItem icon={<Activity className="h-4 w-4" />} label="Torque" value={details.torque} />
                <SpecItem icon={<Fuel className="h-4 w-4" />} label="Mileage" value={details.mileage} />
                <SpecItem icon={<Rocket className="h-4 w-4" />} label="0-100 km/h" value={details.acceleration} />
                <SpecItem icon={<Gauge className="h-4 w-4" />} label="Top Speed" value={details.topSpeed} />
                <SpecItem icon={<Settings className="h-4 w-4" />} label="Transmission" value={transmission} />
                <SpecItem icon={<Mountain className="h-4 w-4" />} label="Ground Clearance" value={details.groundClearance} />
                <SpecItem icon={<Package className="h-4 w-4" />} label="Boot Space" value={details.bootSpace} />
                <SpecItem icon={<Droplets className="h-4 w-4" />} label="Fuel Tank" value={details.fuelTank} />
                <SpecItem icon={<Users className="h-4 w-4" />} label="Seating" value={`${details.seating} persons`} />
                <SpecItem icon={<Calendar className="h-4 w-4" />} label="Car Age" value={`${carAge} year${carAge !== 1 ? "s" : ""}`} />
                <SpecItem icon={<Gauge className="h-4 w-4" />} label="Kms Driven" value={`${kmsDriven.toLocaleString()} km`} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Features */}
        {details && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {details.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="py-1.5 px-3 text-sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Why this Price? */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Why this Price?
            </CardTitle>
            <p className="text-xs text-muted-foreground">Key factors influencing this estimate</p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {getPriceFactors({ carAge, kmsDriven, brand, fuelType, transmission }).map((f) => (
              <FactorRow key={f.label} {...f} />
            ))}
            <p className="text-[11px] text-muted-foreground pt-2 border-t border-border mt-3">
              Estimate based on age, usage, brand demand and configuration. Actual sale price may vary by ±10% depending on condition and location.
            </p>
          </CardContent>
        </Card>

        <Separator />

        {/* Brand Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              About {brand}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Founded:</span>{" "}
                <span className="font-medium text-foreground">{info.founded}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Origin:</span>{" "}
                <span className="font-medium text-foreground">{info.origin}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Check Another Car
        </Button>
      </main>
    </div>
  );
};

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-card text-center">
      <div className="text-primary">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SpecItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

// Adjusts base model specs based on the actual selected variant so that
// Power / Torque / Mileage reflect engine size, fuel, transmission and condition
// instead of being identical for every configuration of the same model.
function adjustSpecsForVariant(
  base: typeof modelDetails[string],
  opts: { fuelType: string; engineSize: number; transmission: string; kmsDriven: number; carAge: number }
) {
  const { fuelType, engineSize, transmission, kmsDriven, carAge } = opts;

  // Electric → keep model's native EV specs untouched
  if (fuelType === "Electric" || /range|kWh/i.test(base.mileage)) {
    return base;
  }

  // Parse base values
  const basePower = parseFloat(base.power) || 100;
  const baseTorque = parseFloat(base.torque) || 130;
  const mileageMatch = base.mileage.match(/([\d.]+)\s*-\s*([\d.]+)/);
  const baseMileageLow = mileageMatch ? parseFloat(mileageMatch[1]) : 15;
  const baseMileageHigh = mileageMatch ? parseFloat(mileageMatch[2]) : 20;

  // Engine size factor (assume base is mid of model's range ~1.5L for typical cars)
  const referenceEngine = 1.5;
  const engineFactor = engineSize / referenceEngine;

  // Fuel multipliers
  const fuelPower = { Petrol: 1.0, Diesel: 0.92, CNG: 0.78, LPG: 0.82, Hybrid: 1.05 }[fuelType] ?? 1.0;
  const fuelTorque = { Petrol: 1.0, Diesel: 1.45, CNG: 0.85, LPG: 0.88, Hybrid: 1.1 }[fuelType] ?? 1.0;
  const fuelMileage = { Petrol: 1.0, Diesel: 1.25, CNG: 1.35, LPG: 1.2, Hybrid: 1.4 }[fuelType] ?? 1.0;

  // Transmission impact on real-world mileage
  const transMileage = transmission === "Automatic" ? 0.93 : 1.0;

  // Wear: older + higher km cars give slightly worse real-world mileage
  const wear = Math.max(0.82, 1 - carAge * 0.012 - (kmsDriven / 100000) * 0.04);

  const power = Math.round(basePower * engineFactor * fuelPower);
  const torque = Math.round(baseTorque * engineFactor * fuelTorque);
  const mLow = (baseMileageLow * fuelMileage * transMileage * wear) / Math.max(0.85, Math.sqrt(engineFactor));
  const mHigh = (baseMileageHigh * fuelMileage * transMileage * wear) / Math.max(0.85, Math.sqrt(engineFactor));

  return {
    ...base,
    power: `${power} bhp`,
    torque: `${torque} Nm`,
    mileage: `${mLow.toFixed(1)}-${mHigh.toFixed(1)} km/l`,
  };
}

type Impact = "positive" | "negative" | "neutral";
interface PriceFactor {
  label: string;
  value: string;
  detail: string;
  impact: Impact;
}

const HIGH_RESALE_BRANDS = ["Maruti", "Toyota", "Honda", "Hyundai", "Kia"];
const PREMIUM_BRANDS = ["BMW", "Mercedes", "Audi", "Jaguar", "Land Rover", "Porsche", "Lexus", "Volvo", "Mini"];

function getPriceFactors({
  carAge,
  kmsDriven,
  brand,
  fuelType,
  transmission,
}: {
  carAge: number;
  kmsDriven: number;
  brand: string;
  fuelType: string;
  transmission: string;
}): PriceFactor[] {
  const factors: PriceFactor[] = [];

  if (carAge <= 2) {
    factors.push({ label: "Car Age", value: `${carAge} year${carAge !== 1 ? "s" : ""}`, detail: "Nearly new — strong value retention", impact: "positive" });
  } else if (carAge <= 5) {
    factors.push({ label: "Car Age", value: `${carAge} years`, detail: "Moderate depreciation applied", impact: "neutral" });
  } else {
    factors.push({ label: "Car Age", value: `${carAge} years`, detail: "Older vehicle — significant depreciation", impact: "negative" });
  }

  const kmsPerYear = carAge > 0 ? kmsDriven / carAge : kmsDriven;
  const kmsLabel = `${kmsDriven.toLocaleString("en-IN")} km`;
  if (kmsDriven < 30000) {
    factors.push({ label: "Km Driven", value: kmsLabel, detail: "Low usage — boosts resale value", impact: "positive" });
  } else if (kmsDriven < 80000 && kmsPerYear < 15000) {
    factors.push({ label: "Km Driven", value: kmsLabel, detail: "Moderate usage — neutral impact", impact: "neutral" });
  } else {
    factors.push({ label: "Km Driven", value: kmsLabel, detail: "High usage — reduces value", impact: "negative" });
  }

  if (HIGH_RESALE_BRANDS.includes(brand)) {
    factors.push({ label: "Brand", value: brand, detail: "Strong resale demand in Indian market", impact: "positive" });
  } else if (PREMIUM_BRANDS.includes(brand)) {
    factors.push({ label: "Brand", value: brand, detail: "Premium brand — higher maintenance lowers resale", impact: "negative" });
  } else {
    factors.push({ label: "Brand", value: brand, detail: "Average resale demand", impact: "neutral" });
  }

  if (fuelType === "Electric") {
    factors.push({ label: "Fuel Type", value: fuelType, detail: "EV market still maturing — limited used demand", impact: "negative" });
  } else if (fuelType === "Diesel") {
    factors.push({ label: "Fuel Type", value: fuelType, detail: "Diesel preferred for SUVs and high-mileage use", impact: "positive" });
  } else if (fuelType === "CNG" || fuelType === "LPG") {
    factors.push({ label: "Fuel Type", value: fuelType, detail: "Lower running cost appeals to buyers", impact: "positive" });
  } else {
    factors.push({ label: "Fuel Type", value: fuelType, detail: "Petrol — broad buyer base", impact: "neutral" });
  }

  if (transmission === "Automatic") {
    factors.push({ label: "Transmission", value: transmission, detail: "Automatic commands a price premium", impact: "positive" });
  } else {
    factors.push({ label: "Transmission", value: transmission, detail: "Manual — broader affordability appeal", impact: "neutral" });
  }

  return factors;
}

function FactorRow({ label, value, detail, impact }: PriceFactor) {
  const config = {
    positive: { Icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", chip: "Boosts price" },
    negative: { Icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", chip: "Lowers price" },
    neutral: { Icon: Minus, color: "text-muted-foreground", bg: "bg-muted", chip: "Neutral" },
  }[impact];
  const { Icon } = config;
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
      <div className={`rounded-full p-2 ${config.bg} ${config.color} shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            {label}: <span className="font-medium text-muted-foreground">{value}</span>
          </p>
          <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            {config.chip}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

export default CarResult;
