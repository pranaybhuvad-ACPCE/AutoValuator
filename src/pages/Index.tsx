import { useRef, useState, useEffect } from "react";
import { PriceInputForm, PriceInputFormRef } from "@/components/PriceInputForm";
import { BrandGrid } from "@/components/BrandGrid";
import { BestSelling } from "@/components/BestSelling";

import { Car, TrendingUp, Sun, Moon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AuthNavigation } from "@/components/AuthNavigation";

const Index = () => {
  const formRef = useRef<PriceInputFormRef>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = saved === "dark" || (!saved && prefersDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
    if (newDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSelectCar = (brand: string, model: string) => {
    formRef.current?.prefill(brand, model);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">AutoValuator</h1>
              <p className="text-xs text-muted-foreground">Resale Price Estimator</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <AuthNavigation />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle color theme"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="space-y-3">
          <h2 className="text-3xl font-bold text-foreground">Check Price of Used Car</h2>
          <p className="text-muted-foreground max-w-3xl">
            AutoValuator suggests used car valuation through its prediction model. While buying a used car, it is very important to understand fair market price. Check used car price of any model produced by any manufacturer like Maruti Suzuki, Hyundai, Mahindra, Honda, Tata, etc.
          </p>
        </section>

        <section className="space-y-5">
          <PriceInputForm ref={formRef} />
        </section>

        <Separator />

        <section>
          <BrandGrid onSelectBrand={(brand) => {
            formRef.current?.prefill(brand, "");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }} />
        </section>

        <Separator />

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Best Selling Cars This Month
          </h2>
          <BestSelling onSelectCar={handleSelectCar} />
        </section>
      </main>
    </div>
  );
};

export default Index;
