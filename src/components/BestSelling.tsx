import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";
import { useState } from "react";

import wagonrImg from "@/assets/cars/wagonr.png";
import swiftImg from "@/assets/cars/swift.jpg";
import cretaImg from "@/assets/cars/creta.jpg";
import punchImg from "@/assets/cars/punch.png";
import balenoImg from "@/assets/cars/baleno.png";
import ertigaImg from "@/assets/cars/ertiga.png";
import brezzaImg from "@/assets/cars/brezza.png";
import nexonImg from "@/assets/cars/nexon.png";
import i20Img from "@/assets/cars/i20.png";
import scorpioNImg from "@/assets/cars/scorpio-n.png";

interface BestSellingCar {
  rank: number;
  brand: string;
  model: string;
  unitsSold: string;
  priceRange: string;
  fuelType: string;
  image: string;
}

const bestSellingCars: BestSellingCar[] = [
  { rank: 1, brand: "Maruti", model: "WagonR", unitsSold: "24,106", priceRange: "₹5.54 – ₹7.42L", fuelType: "Petrol / CNG", image: wagonrImg },
  { rank: 2, brand: "Maruti", model: "Swift", unitsSold: "19,783", priceRange: "₹6.49 – ₹9.64L", fuelType: "Petrol", image: swiftImg },
  { rank: 3, brand: "Hyundai", model: "Creta", unitsSold: "17,525", priceRange: "₹11.0 – ₹20.3L", fuelType: "Petrol / Diesel", image: cretaImg },
  { rank: 4, brand: "Tata", model: "Punch", unitsSold: "16,890", priceRange: "₹6.13 – ₹10.2L", fuelType: "Petrol / CNG", image: punchImg },
  { rank: 5, brand: "Maruti", model: "Baleno", unitsSold: "15,620", priceRange: "₹6.61 – ₹9.88L", fuelType: "Petrol / CNG", image: balenoImg },
  { rank: 6, brand: "Maruti", model: "Ertiga", unitsSold: "15,210", priceRange: "₹8.69 – ₹13.2L", fuelType: "Petrol / CNG", image: ertigaImg },
  { rank: 7, brand: "Maruti", model: "Brezza", unitsSold: "14,780", priceRange: "₹8.34 – ₹14.1L", fuelType: "Petrol / CNG", image: brezzaImg },
  { rank: 8, brand: "Tata", model: "Nexon", unitsSold: "14,350", priceRange: "₹8.0 – ₹15.5L", fuelType: "Petrol / Diesel", image: nexonImg },
  { rank: 9, brand: "Hyundai", model: "i20", unitsSold: "11,420", priceRange: "₹7.04 – ₹11.2L", fuelType: "Petrol / Diesel", image: i20Img },
  { rank: 10, brand: "Mahindra", model: "Scorpio N", unitsSold: "10,890", priceRange: "₹13.8 – ₹24.5L", fuelType: "Petrol / Diesel", image: scorpioNImg },
];

interface Props {
  onSelectCar?: (brand: string, model: string) => void;
}

function CarImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-full h-36 bg-muted flex items-center justify-center">
        <Car className="h-10 w-10 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-36 object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function BestSelling({ onSelectCar }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {bestSellingCars.map((car) => (
        <Card
          key={car.rank}
          className="overflow-hidden border-border/50 shadow-md hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
          onClick={() => onSelectCar?.(car.brand, car.model)}
        >
          <div className="relative">
            <CarImage src={car.image} alt={`${car.brand} ${car.model}`} />
            <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5">
              #{car.rank}
            </Badge>
          </div>
          <CardContent className="p-3 space-y-1.5">
            <div>
              <p className="font-semibold text-sm text-foreground">{car.brand} {car.model}</p>
              <p className="text-xs text-muted-foreground">{car.fuelType}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary">{car.priceRange}</span>
              <span className="text-[10px] text-muted-foreground">{car.unitsSold} units</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
