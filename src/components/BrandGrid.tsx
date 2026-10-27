import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import toyotaLogo from "@/assets/brands/toyota.png";
import hondaLogo from "@/assets/brands/honda.png";
import hyundaiLogo from "@/assets/brands/hyundai.png";
import marutiLogo from "@/assets/brands/maruti.png";
import tataLogo from "@/assets/brands/tata.png";
import mahindraLogo from "@/assets/brands/mahindra.png";
import kiaLogo from "@/assets/brands/kia.png";
import bmwLogo from "@/assets/brands/bmw.png";
import volkswagenLogo from "@/assets/brands/volkswagen.png";
import mgLogo from "@/assets/brands/mg.png";
import mercedesLogo from "@/assets/brands/mercedes-benz.png";
import audiLogo from "@/assets/brands/audi.png";
import skodaLogo from "@/assets/brands/skoda.png";
import renaultLogo from "@/assets/brands/renault.png";
import nissanLogo from "@/assets/brands/nissan.png";
import fordLogo from "@/assets/brands/ford.png";
import jeepLogo from "@/assets/brands/jeep.png";
import volvoLogo from "@/assets/brands/volvo.png";
import jaguarLogo from "@/assets/brands/jaguar.png";
import landRoverLogo from "@/assets/brands/land-rover.png";
import miniLogo from "@/assets/brands/mini.png";
import porscheLogo from "@/assets/brands/porsche.png";
import lexusLogo from "@/assets/brands/lexus.png";
import datsunLogo from "@/assets/brands/datsun.png";
import fiatLogo from "@/assets/brands/fiat.png";
import mitsubishiLogo from "@/assets/brands/mitsubishi.png";
import chevroletLogo from "@/assets/brands/chevrolet.png";
import isuzuLogo from "@/assets/brands/isuzu.png";
import citroenLogo from "@/assets/brands/citroen.png";
import forceLogo from "@/assets/brands/force.png";

const popularBrands = [
  { name: "Maruti", logo: marutiLogo },
  { name: "Hyundai", logo: hyundaiLogo },
  { name: "Tata", logo: tataLogo },
  { name: "Mahindra", logo: mahindraLogo },
  { name: "Toyota", logo: toyotaLogo },
  { name: "Honda", logo: hondaLogo },
  { name: "Kia", logo: kiaLogo },
  { name: "MG", logo: mgLogo },
  { name: "BMW", logo: bmwLogo },
  { name: "Volkswagen", logo: volkswagenLogo },
];

const otherBrands = [
  { name: "Mercedes-Benz", logo: mercedesLogo },
  { name: "Audi", logo: audiLogo },
  { name: "Skoda", logo: skodaLogo },
  { name: "Renault", logo: renaultLogo },
  { name: "Nissan", logo: nissanLogo },
  { name: "Ford", logo: fordLogo },
  { name: "Jeep", logo: jeepLogo },
  { name: "Volvo", logo: volvoLogo },
  { name: "Jaguar", logo: jaguarLogo },
  { name: "Land Rover", logo: landRoverLogo },
  { name: "Mini", logo: miniLogo },
  { name: "Porsche", logo: porscheLogo },
  { name: "Lexus", logo: lexusLogo },
  { name: "Datsun", logo: datsunLogo },
  { name: "Fiat", logo: fiatLogo },
  { name: "Mitsubishi", logo: mitsubishiLogo },
  { name: "Chevrolet", logo: chevroletLogo },
  { name: "Isuzu", logo: isuzuLogo },
  { name: "Citroen", logo: citroenLogo },
  { name: "Force", logo: forceLogo },
];

interface Props {
  onSelectBrand: (brand: string) => void;
}

export function BrandGrid({ onSelectBrand }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Popular Brands</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary hover:text-primary"
        >
          {expanded ? (
            <>
              Show Less <ChevronUp className="ml-1" />
            </>
          ) : (
            <>
              View All Brands <ChevronDown className="ml-1" />
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-3">
        {popularBrands.map((brand) => (
          <button
            key={brand.name}
            onClick={() => onSelectBrand(brand.name)}
            className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all group"
          >
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-10 w-10 object-contain"
              loading="lazy"
            />
            <span className="text-xs font-medium text-foreground">{brand.name}</span>
          </button>
        ))}
      </div>

      {expanded && (
        <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {otherBrands.map((brand) => (
            <button
              key={brand.name}
              onClick={() => onSelectBrand(brand.name)}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 hover:border-primary hover:shadow-md transition-all group"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-10 w-10 object-contain"
                loading="lazy"
              />
              <span className="text-xs font-medium text-foreground truncate w-full text-center">{brand.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
