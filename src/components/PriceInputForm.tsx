import { useState, useEffect, useImperativeHandle, forwardRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brandOptions, fuelTypeOptions, transmissionOptions, brandModels, modelLaunchYear, modelFuelTypes, modelTransmissions, modelEngines } from "@/data/mockCarData";
import { toast } from "@/hooks/use-toast";

const currentYear = new Date().getFullYear();
const defaultEngineOptions = ["1.0", "1.2", "1.5", "1.8", "2.0", "2.5", "3.0"];
const KMS_MIN = 1000;
const KMS_MAX = 300000;

export interface PriceInputFormRef {
  prefill: (brand: string, model: string) => void;
}

export const PriceInputForm = forwardRef<PriceInputFormRef>((_props, ref) => {
  const [year, setYear] = useState("");
  const [kmsDriven, setKmsDriven] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [engineSize, setEngineSize] = useState("");

  const models = brand ? brandModels[brand] || [] : [];
  const launchYear = model ? modelLaunchYear[model] || 2005 : 2005;
  const yearOptions = Array.from({ length: currentYear - launchYear + 1 }, (_, i) => (launchYear + i).toString());
  const availableFuelTypes = model ? (modelFuelTypes[model] || fuelTypeOptions) : fuelTypeOptions;
  const availableTransmissions = model ? (modelTransmissions[model] || transmissionOptions) : transmissionOptions;
  const isElectric = fuelType === 'Electric';
  const availableEngines = isElectric ? ['Electric'] : (model ? (modelEngines[model]?.filter(e => e !== 'Electric') || defaultEngineOptions) : defaultEngineOptions);

  useImperativeHandle(ref, () => ({
    prefill: (b: string, m: string) => {
      setBrand(b);
      if (!m) {
        setModel("");
        setFuelType("");
        setTransmission("");
        setEngineSize("");
        setYear("");
        setKmsDriven("");
        return;
      }
      setModel(m);
      const fuels = modelFuelTypes[m] || fuelTypeOptions;
      setFuelType(fuels[0] || "");
      const trans = modelTransmissions[m] || transmissionOptions;
      setTransmission(trans[0] || "");
      const engines = modelEngines[m] || defaultEngineOptions;
      setEngineSize(engines[0] || "");
      const mLaunch = modelLaunchYear[m] || 2005;
      setYear(String(Math.max(mLaunch, 2020)));
      setKmsDriven("30000");
    }
  }));

  const handleBrandChange = (b: string) => {
    setBrand(b);
    setModel("");
    setYear("");
  };

  const handleModelChange = (m: string) => {
    setModel(m);
    const mLaunch = modelLaunchYear[m] || 2005;
    if (+year < mLaunch) setYear("");
    const fuels = modelFuelTypes[m] || fuelTypeOptions;
    if (fuelType && !fuels.includes(fuelType)) setFuelType("");
    const trans = modelTransmissions[m] || transmissionOptions;
    if (transmission && !trans.includes(transmission)) setTransmission("");
    const engines = modelEngines[m] || defaultEngineOptions;
    if (engineSize && !engines.includes(engineSize)) setEngineSize("");
  };

  const handleFuelChange = (f: string) => {
    setFuelType(f);
    if (f === 'Electric') {
      setTransmission('Automatic');
      setEngineSize('Electric');
    } else {
      if (engineSize === 'Electric') setEngineSize("");
    }
  };

  const navigate = useNavigate();

  const kmsNum = kmsDriven === "" ? NaN : Number(kmsDriven);
  const yearNum = year === "" ? NaN : Number(year);
  const minYear = model ? (modelLaunchYear[model] || 2005) : 1980;

  const kmsError = useMemo(() => {
    if (kmsDriven === "") return "Kms driven is required";
    if (!Number.isFinite(kmsNum) || !Number.isInteger(kmsNum)) return "Enter a valid number";
    if (kmsNum < KMS_MIN) return `Minimum ${KMS_MIN.toLocaleString("en-IN")} km`;
    if (kmsNum > KMS_MAX) return `Maximum ${KMS_MAX.toLocaleString("en-IN")} km`;
    return "";
  }, [kmsDriven, kmsNum]);

  const yearError = useMemo(() => {
    if (year === "") return "Year is required";
    if (!Number.isFinite(yearNum)) return "Invalid year";
    if (yearNum > currentYear) return `Year cannot exceed ${currentYear}`;
    if (yearNum < minYear) return `Year must be ${minYear} or later`;
    return "";
  }, [year, yearNum, minYear]);

  const requiredMissing = !brand || !model || !fuelType || !transmission || !engineSize;
  const isInvalid = requiredMissing || !!kmsError || !!yearError;

  const handleSubmit = () => {
    if (isInvalid) {
      toast({
        title: "Please fix the errors",
        description: kmsError || yearError || "Fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    const params = new URLSearchParams({
      brand,
      model,
      year,
      kms: String(kmsNum),
      fuel: fuelType,
      transmission,
      engine: engineSize,
    });
    navigate(`/result?${params.toString()}`);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Brand</Label>
          <Select value={brand} onValueChange={handleBrandChange}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select Make" /></SelectTrigger>
            <SelectContent>
              {brandOptions.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between h-4">
            <Label className="text-xs font-medium text-muted-foreground">Model</Label>
            {brand && models.length > 0 && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {models.length}
              </span>
            )}
          </div>
          <Select value={model} onValueChange={handleModelChange} disabled={!brand}>
            <SelectTrigger
              className={`h-10 transition-opacity ${!brand ? "opacity-60 cursor-not-allowed" : ""}`}
              title={!brand ? "Select a brand first to load models" : undefined}
            >
              <SelectValue placeholder={brand ? "Select Model" : "Select brand first"} />
            </SelectTrigger>
            <SelectContent>
              {models.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No models available</div>
              ) : (
                models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Year</Label>
          <Select value={year} onValueChange={setYear} disabled={!model}>
            <SelectTrigger className={`h-10 ${year && yearError ? "border-destructive focus:ring-destructive" : ""}`}>
              <SelectValue placeholder={model ? "Select Year" : "Select model first"} />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.filter(y => Number(y) <= currentYear).map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          {year && yearError && <p className="text-xs text-destructive">{yearError}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Fuel Type</Label>
          <Select value={fuelType} onValueChange={handleFuelChange}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select Fuel" /></SelectTrigger>
            <SelectContent>
              {availableFuelTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Transmission</Label>
          <Select value={transmission} onValueChange={setTransmission} disabled={isElectric}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Select Type" /></SelectTrigger>
            <SelectContent>
              {availableTransmissions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Engine (L)</Label>
          <Select value={engineSize} onValueChange={setEngineSize} disabled={isElectric}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Engine" /></SelectTrigger>
            <SelectContent>
              {availableEngines.map(e => <SelectItem key={e} value={e}>{e === 'Electric' ? 'Electric' : `${e}L`}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Kms Driven</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={KMS_MIN}
            max={KMS_MAX}
            step={100}
            value={kmsDriven}
            onChange={e => setKmsDriven(e.target.value)}
            placeholder={`${KMS_MIN.toLocaleString("en-IN")} - ${KMS_MAX.toLocaleString("en-IN")}`}
            className={`h-10 ${kmsDriven && kmsError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            aria-invalid={!!kmsError}
          />
          {kmsDriven && kmsError ? (
            <p className="text-xs text-destructive">{kmsError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Range: 1,000 – 3,00,000 km</p>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full h-10"
            disabled={isInvalid}
          >
            Check Price
          </Button>
        </div>
      </div>
    </div>
  );
});

PriceInputForm.displayName = "PriceInputForm";
