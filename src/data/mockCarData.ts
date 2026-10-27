export interface CarData {
  brand: string;
  year: number;
  kmsDriven: number;
  fuelType: string;
  transmission: string;
  engineSize: number;
  sellingPrice: number;
}

const brands = [
  'Toyota', 'Honda', 'Hyundai', 'Maruti', 'Ford', 'BMW', 'Audi', 'Mercedes', 'Volkswagen', 'Kia',
  'Tata', 'Mahindra', 'Skoda', 'Renault', 'Nissan', 'MG', 'Jeep', 'Citroen', 'Volvo', 'Land Rover',
  'Jaguar', 'Lexus', 'Porsche', 'Mini', 'Isuzu',
];
const fuelTypes = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const transmissions = ['Manual', 'Automatic'];

export const modelFuelTypes: Record<string, string[]> = {
  // Toyota
  Innova: ['Petrol', 'Diesel'], Fortuner: ['Petrol', 'Diesel'], Camry: ['Petrol'], Corolla: ['Petrol', 'Diesel'],
  Etios: ['Petrol', 'Diesel'], Glanza: ['Petrol', 'CNG'], 'Urban Cruiser': ['Petrol'], 'Innova Hycross': ['Petrol'],
  // Honda
  City: ['Petrol', 'Diesel'], Civic: ['Petrol', 'Diesel'], Amaze: ['Petrol', 'Diesel', 'CNG'],
  'WR-V': ['Petrol', 'Diesel'], Jazz: ['Petrol', 'Diesel'], 'CR-V': ['Petrol', 'Diesel'], Accord: ['Petrol'], Elevate: ['Petrol'],
  // Hyundai
  Creta: ['Petrol', 'Diesel'], Venue: ['Petrol', 'Diesel', 'CNG'], i20: ['Petrol', 'Diesel', 'CNG'],
  Verna: ['Petrol', 'Diesel'], Tucson: ['Petrol', 'Diesel'], i10: ['Petrol', 'CNG'], Santro: ['Petrol', 'CNG'],
  Alcazar: ['Petrol', 'Diesel'], Exter: ['Petrol', 'CNG'],
  // Maruti
  Swift: ['Petrol', 'CNG'], Baleno: ['Petrol', 'CNG'], Alto: ['Petrol', 'CNG'], Dzire: ['Petrol', 'CNG'],
  Brezza: ['Petrol', 'CNG'], Ertiga: ['Petrol', 'CNG'], WagonR: ['Petrol', 'CNG'], Fronx: ['Petrol', 'CNG'],
  Jimny: ['Petrol'], 'Grand Vitara': ['Petrol'],
  // Ford
  EcoSport: ['Petrol', 'Diesel'], Endeavour: ['Diesel'], Figo: ['Petrol', 'Diesel'],
  Aspire: ['Petrol', 'Diesel'], Freestyle: ['Petrol', 'Diesel'], Mustang: ['Petrol'],
  // BMW
  '3 Series': ['Petrol', 'Diesel'], '5 Series': ['Petrol', 'Diesel'], X1: ['Petrol', 'Diesel'],
  X3: ['Petrol', 'Diesel'], X5: ['Petrol', 'Diesel'], '7 Series': ['Petrol', 'Diesel'], Z4: ['Petrol'], X7: ['Petrol', 'Diesel'], iX: ['Electric'],
  // Audi
  A4: ['Petrol'], A6: ['Petrol'], Q3: ['Petrol'], Q5: ['Petrol', 'Diesel'], Q7: ['Petrol', 'Diesel'],
  A3: ['Petrol'], RS5: ['Petrol'], 'e-tron': ['Electric'], Q8: ['Petrol'],
  // Mercedes
  'C-Class': ['Petrol', 'Diesel'], 'E-Class': ['Petrol', 'Diesel'], GLA: ['Petrol', 'Diesel'],
  GLC: ['Petrol', 'Diesel'], GLE: ['Petrol', 'Diesel'], 'A-Class': ['Petrol', 'Diesel'],
  'S-Class': ['Petrol', 'Diesel'], EQS: ['Electric'], GLS: ['Petrol', 'Diesel'],
  // Volkswagen
  Polo: ['Petrol'], Vento: ['Petrol', 'Diesel'], Taigun: ['Petrol'], Tiguan: ['Petrol'],
  Jetta: ['Petrol', 'Diesel'], Passat: ['Petrol', 'Diesel'], Virtus: ['Petrol'],
  // Kia
  Seltos: ['Petrol', 'Diesel'], Sonet: ['Petrol', 'Diesel'], Carnival: ['Diesel'], Carens: ['Petrol', 'Diesel'], EV6: ['Electric'],
  // Tata
  Nexon: ['Petrol', 'Diesel', 'Electric'], Harrier: ['Diesel'], Safari: ['Diesel'], Punch: ['Petrol', 'Electric'],
  Altroz: ['Petrol', 'Diesel'], Tiago: ['Petrol', 'CNG', 'Electric'], Tigor: ['Petrol', 'CNG', 'Electric'],
  Nano: ['Petrol'], Indica: ['Petrol', 'Diesel'],
  // Mahindra
  Thar: ['Petrol', 'Diesel'], XUV700: ['Petrol', 'Diesel'], Scorpio: ['Diesel'],
  XUV300: ['Petrol', 'Diesel'], Bolero: ['Diesel'], XUV400: ['Electric'], 'Scorpio-N': ['Petrol', 'Diesel'], Marazzo: ['Diesel'],
  // Skoda
  Octavia: ['Petrol'], Superb: ['Petrol'], Kushaq: ['Petrol'], Slavia: ['Petrol'], Rapid: ['Petrol', 'Diesel'], Kodiaq: ['Petrol', 'Diesel'],
  // Renault
  Kwid: ['Petrol'], Triber: ['Petrol'], Kiger: ['Petrol'], Duster: ['Petrol', 'Diesel'], Captur: ['Petrol', 'Diesel'],
  // Nissan
  Magnite: ['Petrol'], Kicks: ['Petrol'], Terrano: ['Petrol', 'Diesel'], Sunny: ['Petrol', 'Diesel'], Micra: ['Petrol', 'Diesel'],
  // MG
  Hector: ['Petrol', 'Diesel'], Astor: ['Petrol'], Gloster: ['Diesel'], 'ZS EV': ['Electric'], Comet: ['Electric'],
  // Jeep
  Compass: ['Petrol', 'Diesel'], Meridian: ['Diesel'], Wrangler: ['Petrol'], 'Grand Cherokee': ['Petrol'],
  // Citroen
  C3: ['Petrol'], 'C3 Aircross': ['Petrol'], 'C5 Aircross': ['Petrol', 'Diesel'], eC3: ['Electric'],
  // Volvo
  XC40: ['Petrol', 'Electric'], XC60: ['Petrol', 'Diesel'], XC90: ['Petrol', 'Diesel'], S60: ['Petrol'], S90: ['Petrol', 'Diesel'],
  // Land Rover
  Defender: ['Petrol', 'Diesel'], Discovery: ['Petrol', 'Diesel'], 'Range Rover': ['Petrol', 'Diesel'],
  'Range Rover Sport': ['Petrol', 'Diesel'], Evoque: ['Petrol', 'Diesel'],
  // Jaguar
  'F-Pace': ['Petrol', 'Diesel'], XE: ['Petrol', 'Diesel'], XF: ['Petrol', 'Diesel'], 'I-Pace': ['Electric'], 'F-Type': ['Petrol'],
  // Lexus
  ES: ['Petrol'], NX: ['Petrol'], RX: ['Petrol'], LX: ['Diesel'], LC: ['Petrol'],
  // Porsche
  Cayenne: ['Petrol'], Macan: ['Petrol'], Taycan: ['Electric'], '911': ['Petrol'], Panamera: ['Petrol'],
  // Mini
  Cooper: ['Petrol'], Countryman: ['Petrol', 'Diesel'], Clubman: ['Petrol', 'Diesel'],
  // Isuzu
  'D-Max': ['Diesel'], 'MU-X': ['Diesel'], 'V-Cross': ['Diesel'],
};

export const modelTransmissions: Record<string, string[]> = {
  // Toyota
  Innova: ['Manual', 'Automatic'], Fortuner: ['Manual', 'Automatic'], Camry: ['Automatic'], Corolla: ['Manual', 'Automatic'],
  Etios: ['Manual'], Glanza: ['Manual', 'Automatic'], 'Urban Cruiser': ['Manual', 'Automatic'], 'Innova Hycross': ['Automatic'],
  // Honda
  City: ['Manual', 'Automatic'], Civic: ['Manual', 'Automatic'], Amaze: ['Manual', 'Automatic'],
  'WR-V': ['Manual'], Jazz: ['Manual', 'Automatic'], 'CR-V': ['Automatic'], Accord: ['Automatic'], Elevate: ['Manual', 'Automatic'],
  // Hyundai
  Creta: ['Manual', 'Automatic'], Venue: ['Manual', 'Automatic'], i20: ['Manual', 'Automatic'],
  Verna: ['Manual', 'Automatic'], Tucson: ['Automatic'], i10: ['Manual', 'Automatic'], Santro: ['Manual', 'Automatic'],
  Alcazar: ['Manual', 'Automatic'], Exter: ['Manual', 'Automatic'],
  // Maruti
  Swift: ['Manual', 'Automatic'], Baleno: ['Manual', 'Automatic'], Alto: ['Manual'], Dzire: ['Manual', 'Automatic'],
  Brezza: ['Manual', 'Automatic'], Ertiga: ['Manual', 'Automatic'], WagonR: ['Manual', 'Automatic'], Fronx: ['Manual', 'Automatic'],
  Jimny: ['Manual', 'Automatic'], 'Grand Vitara': ['Manual', 'Automatic'],
  // Ford
  EcoSport: ['Manual', 'Automatic'], Endeavour: ['Automatic'], Figo: ['Manual', 'Automatic'],
  Aspire: ['Manual', 'Automatic'], Freestyle: ['Manual'], Mustang: ['Automatic'],
  // BMW
  '3 Series': ['Automatic'], '5 Series': ['Automatic'], X1: ['Automatic'], X3: ['Automatic'],
  X5: ['Automatic'], '7 Series': ['Automatic'], Z4: ['Automatic'], X7: ['Automatic'], iX: ['Automatic'],
  // Audi
  A4: ['Automatic'], A6: ['Automatic'], Q3: ['Automatic'], Q5: ['Automatic'], Q7: ['Automatic'],
  A3: ['Automatic'], RS5: ['Automatic'], 'e-tron': ['Automatic'], Q8: ['Automatic'],
  // Mercedes
  'C-Class': ['Automatic'], 'E-Class': ['Automatic'], GLA: ['Automatic'], GLC: ['Automatic'],
  GLE: ['Automatic'], 'A-Class': ['Automatic'], 'S-Class': ['Automatic'], EQS: ['Automatic'], GLS: ['Automatic'],
  // Volkswagen
  Polo: ['Manual', 'Automatic'], Vento: ['Manual', 'Automatic'], Taigun: ['Manual', 'Automatic'],
  Tiguan: ['Automatic'], Jetta: ['Manual', 'Automatic'], Passat: ['Automatic'], Virtus: ['Manual', 'Automatic'],
  // Kia
  Seltos: ['Manual', 'Automatic'], Sonet: ['Manual', 'Automatic'], Carnival: ['Automatic'],
  Carens: ['Manual', 'Automatic'], EV6: ['Automatic'],
  // Tata
  Nexon: ['Manual', 'Automatic'], Harrier: ['Manual', 'Automatic'], Safari: ['Manual', 'Automatic'],
  Punch: ['Manual', 'Automatic'], Altroz: ['Manual', 'Automatic'], Tiago: ['Manual', 'Automatic'],
  Tigor: ['Manual', 'Automatic'], Nano: ['Manual'], Indica: ['Manual'],
  // Mahindra
  Thar: ['Manual', 'Automatic'], XUV700: ['Manual', 'Automatic'], Scorpio: ['Manual', 'Automatic'],
  XUV300: ['Manual', 'Automatic'], Bolero: ['Manual'], XUV400: ['Automatic'], 'Scorpio-N': ['Manual', 'Automatic'], Marazzo: ['Manual', 'Automatic'],
  // Skoda
  Octavia: ['Automatic'], Superb: ['Automatic'], Kushaq: ['Manual', 'Automatic'], Slavia: ['Manual', 'Automatic'],
  Rapid: ['Manual', 'Automatic'], Kodiaq: ['Automatic'],
  // Renault
  Kwid: ['Manual', 'Automatic'], Triber: ['Manual', 'Automatic'], Kiger: ['Manual', 'Automatic'],
  Duster: ['Manual', 'Automatic'], Captur: ['Manual', 'Automatic'],
  // Nissan
  Magnite: ['Manual', 'Automatic'], Kicks: ['Manual', 'Automatic'], Terrano: ['Manual', 'Automatic'],
  Sunny: ['Manual', 'Automatic'], Micra: ['Manual', 'Automatic'],
  // MG
  Hector: ['Manual', 'Automatic'], Astor: ['Manual', 'Automatic'], Gloster: ['Automatic'],
  'ZS EV': ['Automatic'], Comet: ['Automatic'],
  // Jeep
  Compass: ['Manual', 'Automatic'], Meridian: ['Automatic'], Wrangler: ['Automatic'], 'Grand Cherokee': ['Automatic'],
  // Citroen
  C3: ['Manual'], 'C3 Aircross': ['Manual', 'Automatic'], 'C5 Aircross': ['Automatic'], eC3: ['Automatic'],
  // Volvo
  XC40: ['Automatic'], XC60: ['Automatic'], XC90: ['Automatic'], S60: ['Automatic'], S90: ['Automatic'],
  // Land Rover
  Defender: ['Automatic'], Discovery: ['Automatic'], 'Range Rover': ['Automatic'],
  'Range Rover Sport': ['Automatic'], Evoque: ['Automatic'],
  // Jaguar
  'F-Pace': ['Automatic'], XE: ['Automatic'], XF: ['Automatic'], 'I-Pace': ['Automatic'], 'F-Type': ['Automatic'],
  // Lexus
  ES: ['Automatic'], NX: ['Automatic'], RX: ['Automatic'], LX: ['Automatic'], LC: ['Automatic'],
  // Porsche
  Cayenne: ['Automatic'], Macan: ['Automatic'], Taycan: ['Automatic'], '911': ['Automatic'], Panamera: ['Automatic'],
  // Mini
  Cooper: ['Automatic'], Countryman: ['Automatic'], Clubman: ['Automatic'],
  // Isuzu
  'D-Max': ['Manual', 'Automatic'], 'MU-X': ['Automatic'], 'V-Cross': ['Manual', 'Automatic'],
};

export const modelEngines: Record<string, string[]> = {
  // Toyota
  Innova: ['2.5', '2.7'], Fortuner: ['2.7', '2.8'], Camry: ['2.5'], Corolla: ['1.8'],
  Etios: ['1.2', '1.5'], Glanza: ['1.2'], 'Urban Cruiser': ['1.5'], 'Innova Hycross': ['2.0'],
  // Honda
  City: ['1.5'], Civic: ['1.8', '2.0'], Amaze: ['1.2', '1.5'],
  'WR-V': ['1.2', '1.5'], Jazz: ['1.2', '1.5'], 'CR-V': ['2.0', '2.4'], Accord: ['2.4'], Elevate: ['1.5'],
  // Hyundai
  Creta: ['1.5', '2.0'], Venue: ['1.0', '1.2', '1.5'], i20: ['1.0', '1.2', '1.5'],
  Verna: ['1.5'], Tucson: ['2.0'], i10: ['1.0', '1.2'], Santro: ['1.1'],
  Alcazar: ['1.5', '2.0'], Exter: ['1.2'],
  // Maruti
  Swift: ['1.2'], Baleno: ['1.2'], Alto: ['0.8', '1.0'], Dzire: ['1.2'],
  Brezza: ['1.5'], Ertiga: ['1.5'], WagonR: ['1.0', '1.2'], Fronx: ['1.0', '1.2'],
  Jimny: ['1.5'], 'Grand Vitara': ['1.5'],
  // Ford
  EcoSport: ['1.0', '1.5'], Endeavour: ['2.0', '3.2'], Figo: ['1.2', '1.5'],
  Aspire: ['1.2', '1.5'], Freestyle: ['1.2', '1.5'], Mustang: ['5.0'],
  // BMW
  '3 Series': ['2.0', '3.0'], '5 Series': ['2.0', '3.0'], X1: ['1.5', '2.0'], X3: ['2.0'],
  X5: ['3.0'], '7 Series': ['3.0'], Z4: ['2.0', '3.0'], X7: ['3.0'], iX: ['Electric'],
  // Audi
  A4: ['2.0'], A6: ['2.0'], Q3: ['2.0'], Q5: ['2.0'], Q7: ['2.0', '3.0'],
  A3: ['1.4', '2.0'], RS5: ['2.9'], 'e-tron': ['Electric'], Q8: ['3.0'],
  // Mercedes
  'C-Class': ['1.5', '2.0'], 'E-Class': ['2.0', '3.0'], GLA: ['1.3', '2.0'], GLC: ['2.0'],
  GLE: ['2.0', '3.0'], 'A-Class': ['1.3', '2.0'], 'S-Class': ['3.0'], EQS: ['Electric'], GLS: ['3.0'],
  // Volkswagen
  Polo: ['1.0', '1.2'], Vento: ['1.2', '1.5'], Taigun: ['1.0', '1.5'],
  Tiguan: ['2.0'], Jetta: ['1.4', '2.0'], Passat: ['2.0'], Virtus: ['1.0', '1.5'],
  // Kia
  Seltos: ['1.4', '1.5'], Sonet: ['1.0', '1.2', '1.5'], Carnival: ['2.2'],
  Carens: ['1.4', '1.5'], EV6: ['Electric'],
  // Tata
  Nexon: ['1.2', '1.5', 'Electric'], Harrier: ['2.0'], Safari: ['2.0'], Punch: ['1.2', 'Electric'],
  Altroz: ['1.2', '1.5'], Tiago: ['1.2', 'Electric'], Tigor: ['1.2', 'Electric'],
  Nano: ['0.6'], Indica: ['1.2', '1.4'],
  // Mahindra
  Thar: ['1.5', '2.0', '2.2'], XUV700: ['2.0', '2.2'], Scorpio: ['2.2', '2.5'],
  XUV300: ['1.2', '1.5'], Bolero: ['1.5'], XUV400: ['Electric'], 'Scorpio-N': ['2.0', '2.2'], Marazzo: ['1.5'],
  // Skoda
  Octavia: ['2.0'], Superb: ['2.0'], Kushaq: ['1.0', '1.5'], Slavia: ['1.0', '1.5'],
  Rapid: ['1.0', '1.5'], Kodiaq: ['2.0'],
  // Renault
  Kwid: ['0.8', '1.0'], Triber: ['1.0'], Kiger: ['1.0'], Duster: ['1.5', '2.0'], Captur: ['1.5'],
  // Nissan
  Magnite: ['1.0'], Kicks: ['1.5'], Terrano: ['1.5'], Sunny: ['1.5'], Micra: ['1.2', '1.5'],
  // MG
  Hector: ['1.5', '2.0'], Astor: ['1.3', '1.5'], Gloster: ['2.0'],
  'ZS EV': ['Electric'], Comet: ['Electric'],
  // Jeep
  Compass: ['1.4', '2.0'], Meridian: ['2.0'], Wrangler: ['2.0'], 'Grand Cherokee': ['2.0'],
  // Citroen
  C3: ['1.2'], 'C3 Aircross': ['1.2'], 'C5 Aircross': ['2.0'], eC3: ['Electric'],
  // Volvo
  XC40: ['2.0', 'Electric'], XC60: ['2.0'], XC90: ['2.0'], S60: ['2.0'], S90: ['2.0'],
  // Land Rover
  Defender: ['2.0', '3.0'], Discovery: ['2.0', '3.0'], 'Range Rover': ['3.0', '4.4'],
  'Range Rover Sport': ['3.0'], Evoque: ['2.0'],
  // Jaguar
  'F-Pace': ['2.0', '3.0'], XE: ['2.0'], XF: ['2.0'], 'I-Pace': ['Electric'], 'F-Type': ['2.0', '3.0', '5.0'],
  // Lexus
  ES: ['2.5'], NX: ['2.5'], RX: ['2.0'], LX: ['4.5'], LC: ['5.0'],
  // Porsche
  Cayenne: ['3.0', '4.0'], Macan: ['2.0', '3.0'], Taycan: ['Electric'], '911': ['3.0', '3.8'], Panamera: ['2.9', '4.0'],
  // Mini
  Cooper: ['1.5', '2.0'], Countryman: ['1.5', '2.0'], Clubman: ['1.5', '2.0'],
  // Isuzu
  'D-Max': ['1.9', '3.0'], 'MU-X': ['1.9', '3.0'], 'V-Cross': ['1.9', '2.5'],
};

export const brandModels: Record<string, string[]> = {
  Toyota: ['Innova', 'Fortuner', 'Camry', 'Corolla', 'Etios', 'Glanza', 'Urban Cruiser', 'Innova Hycross'],
  Honda: ['City', 'Civic', 'Amaze', 'WR-V', 'Jazz', 'CR-V', 'Accord', 'Elevate'],
  Hyundai: ['Creta', 'Venue', 'i20', 'Verna', 'Tucson', 'i10', 'Santro', 'Alcazar', 'Exter'],
  Maruti: ['Swift', 'Baleno', 'Alto', 'Dzire', 'Brezza', 'Ertiga', 'WagonR', 'Fronx', 'Jimny', 'Grand Vitara'],
  Ford: ['EcoSport', 'Endeavour', 'Figo', 'Aspire', 'Freestyle', 'Mustang'],
  BMW: ['3 Series', '5 Series', 'X1', 'X3', 'X5', '7 Series', 'Z4', 'X7', 'iX'],
  Audi: ['A4', 'A6', 'Q3', 'Q5', 'Q7', 'A3', 'RS5', 'e-tron', 'Q8'],
  Mercedes: ['C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'A-Class', 'S-Class', 'EQS', 'GLS'],
  Volkswagen: ['Polo', 'Vento', 'Taigun', 'Tiguan', 'Jetta', 'Passat', 'Virtus'],
  Kia: ['Seltos', 'Sonet', 'Carnival', 'Carens', 'EV6'],
  Tata: ['Nexon', 'Harrier', 'Safari', 'Punch', 'Altroz', 'Tiago', 'Tigor', 'Nano', 'Indica'],
  Mahindra: ['Thar', 'XUV700', 'Scorpio', 'XUV300', 'Bolero', 'XUV400', 'Scorpio-N', 'Marazzo'],
  Skoda: ['Octavia', 'Superb', 'Kushaq', 'Slavia', 'Rapid', 'Kodiaq'],
  Renault: ['Kwid', 'Triber', 'Kiger', 'Duster', 'Captur'],
  Nissan: ['Magnite', 'Kicks', 'Terrano', 'Sunny', 'Micra'],
  MG: ['Hector', 'Astor', 'Gloster', 'ZS EV', 'Comet'],
  Jeep: ['Compass', 'Meridian', 'Wrangler', 'Grand Cherokee'],
  Citroen: ['C3', 'C3 Aircross', 'C5 Aircross', 'eC3'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60', 'S90'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport', 'Evoque'],
  Jaguar: ['F-Pace', 'XE', 'XF', 'I-Pace', 'F-Type'],
  Lexus: ['ES', 'NX', 'RX', 'LX', 'LC'],
  Porsche: ['Cayenne', 'Macan', 'Taycan', '911', 'Panamera'],
  Mini: ['Cooper', 'Countryman', 'Clubman'],
  Isuzu: ['D-Max', 'MU-X', 'V-Cross'],
};

export const modelLaunchYear: Record<string, number> = {
  // Toyota
  Innova: 2005, Fortuner: 2009, Camry: 2006, Corolla: 2005, Etios: 2010, Glanza: 2019, 'Urban Cruiser': 2020, 'Innova Hycross': 2023,
  // Honda
  City: 2005, Civic: 2006, Amaze: 2013, 'WR-V': 2017, Jazz: 2009, 'CR-V': 2005, Accord: 2005, Elevate: 2023,
  // Hyundai
  Creta: 2015, Venue: 2019, i20: 2008, Verna: 2006, Tucson: 2005, i10: 2007, Santro: 2005, Alcazar: 2021, Exter: 2023,
  // Maruti
  Swift: 2005, Baleno: 2015, Alto: 2005, Dzire: 2008, Brezza: 2016, Ertiga: 2012, WagonR: 2005, Fronx: 2023, Jimny: 2023, 'Grand Vitara': 2022,
  // Ford
  EcoSport: 2013, Endeavour: 2005, Figo: 2010, Aspire: 2015, Freestyle: 2018, Mustang: 2012,
  // BMW
  '3 Series': 2005, '5 Series': 2005, X1: 2010, X3: 2011, X5: 2007, '7 Series': 2005, Z4: 2009, X7: 2019, iX: 2022,
  // Audi
  A4: 2005, A6: 2005, Q3: 2012, Q5: 2009, Q7: 2006, A3: 2014, RS5: 2018, 'e-tron': 2021, Q8: 2020,
  // Mercedes
  'C-Class': 2005, 'E-Class': 2005, GLA: 2014, GLC: 2016, GLE: 2015, 'A-Class': 2013, 'S-Class': 2005, EQS: 2022, GLS: 2016,
  // Volkswagen
  Polo: 2010, Vento: 2010, Taigun: 2021, Tiguan: 2017, Jetta: 2005, Passat: 2007, Virtus: 2022,
  // Kia
  Seltos: 2019, Sonet: 2020, Carnival: 2020, Carens: 2022, EV6: 2022,
  // Tata
  Nexon: 2017, Harrier: 2019, Safari: 2005, Punch: 2021, Altroz: 2020, Tiago: 2016, Tigor: 2017, Nano: 2009, Indica: 2005,
  // Mahindra
  Thar: 2010, XUV700: 2021, Scorpio: 2005, XUV300: 2019, Bolero: 2005, XUV400: 2023, 'Scorpio-N': 2022, Marazzo: 2018,
  // Skoda
  Octavia: 2005, Superb: 2005, Kushaq: 2021, Slavia: 2022, Rapid: 2011, Kodiaq: 2017,
  // Renault
  Kwid: 2015, Triber: 2019, Kiger: 2021, Duster: 2012, Captur: 2017,
  // Nissan
  Magnite: 2020, Kicks: 2019, Terrano: 2013, Sunny: 2011, Micra: 2010,
  // MG
  Hector: 2019, Astor: 2021, Gloster: 2020, 'ZS EV': 2020, Comet: 2023,
  // Jeep
  Compass: 2017, Meridian: 2022, Wrangler: 2016, 'Grand Cherokee': 2016,
  // Citroen
  C3: 2022, 'C3 Aircross': 2023, 'C5 Aircross': 2021, eC3: 2023,
  // Volvo
  XC40: 2018, XC60: 2017, XC90: 2015, S60: 2013, S90: 2016,
  // Land Rover
  Defender: 2020, Discovery: 2009, 'Range Rover': 2005, 'Range Rover Sport': 2005, Evoque: 2011,
  // Jaguar
  'F-Pace': 2016, XE: 2016, XF: 2009, 'I-Pace': 2020, 'F-Type': 2013,
  // Lexus
  ES: 2017, NX: 2017, RX: 2017, LX: 2017, LC: 2020,
  // Porsche
  Cayenne: 2005, Macan: 2014, Taycan: 2021, '911': 2005, Panamera: 2010,
  // Mini
  Cooper: 2012, Countryman: 2013, Clubman: 2016,
  // Isuzu
  'D-Max': 2008, 'MU-X': 2017, 'V-Cross': 2016,
};

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateData(): CarData[] {
  const data: CarData[] = [];
  for (let i = 0; i < 500; i++) {
    const brand = brands[Math.floor(seededRandom(i * 7) * brands.length)];
    const year = 2005 + Math.floor(seededRandom(i * 13) * 20);
    const kmsDriven = Math.floor(seededRandom(i * 17) * 200000) + 5000;
    const fuelType = fuelTypes[Math.floor(seededRandom(i * 23) * fuelTypes.length)];
    const transmission = transmissions[Math.floor(seededRandom(i * 29) * 2)];
    const engineSize = [1.0, 1.2, 1.5, 1.8, 2.0, 2.5, 3.0][Math.floor(seededRandom(i * 31) * 7)];

    const brandMultiplier = ['BMW', 'Audi', 'Mercedes', 'Volvo', 'Land Rover', 'Jaguar', 'Lexus', 'Porsche', 'Mini'].includes(brand) ? 2.5 : 1;
    const yearFactor = (year - 2005) * 0.3;
    const kmFactor = -kmsDriven * 0.000015;
    const fuelFactor = fuelType === 'Diesel' ? 0.8 : fuelType === 'Electric' ? 1.5 : 1;
    const transFactor = transmission === 'Automatic' ? 1.2 : 1;
    const engineFactor = engineSize * 1.5;

    const basePrice = 3 + yearFactor + kmFactor + engineFactor;
    const price = Math.max(0.5, basePrice * brandMultiplier * fuelFactor * transFactor + seededRandom(i * 37) * 2);

    data.push({
      brand, year, kmsDriven, fuelType, transmission, engineSize,
      sellingPrice: Math.round(price * 100) / 100,
    });
  }
  return data;
}

export const mockCarData = generateData();

export const brandOptions = brands;
export const fuelTypeOptions = fuelTypes;
export const transmissionOptions = transmissions;

const evBatteryEquivalent: Record<string, number> = {
  // Small EVs
  Comet: 0.8, eC3: 1.0, Tiago: 1.0, Tigor: 1.0, Punch: 1.2,
  // Mid EVs
  Nexon: 1.5, 'ZS EV': 1.8, XUV400: 1.8, XC40: 2.0,
  // Premium EVs
  EV6: 2.5, 'e-tron': 2.8, iX: 3.0, 'I-Pace': 3.0, EQS: 3.5, Taycan: 3.5,
};

export function predictPrice(year: number, kmsDriven: number, brand: string, fuelType: string, transmission: string, engineSize: number, model?: string): number {
  const brandMultiplier = ['BMW', 'Audi', 'Mercedes', 'Volvo', 'Land Rover', 'Jaguar', 'Lexus', 'Porsche', 'Mini'].includes(brand) ? 2.5 : 1;
  const yearFactor = (year - 2005) * 0.3;
  const kmFactor = -kmsDriven * 0.000015;
  const fuelFactor = fuelType === 'Diesel' ? 0.8 : fuelType === 'Electric' ? 1.5 : 1;
  const transFactor = transmission === 'Automatic' ? 1.2 : 1;
  const effectiveEngineSize = isNaN(engineSize) ? (model && evBatteryEquivalent[model] ? evBatteryEquivalent[model] : 1.5) : engineSize;
  const engineFactor = effectiveEngineSize * 1.5;
  const basePrice = 3 + yearFactor + kmFactor + engineFactor;
  const price = Math.max(0.5, basePrice * brandMultiplier * fuelFactor * transFactor);
  return Math.round(price * 100) / 100;
}
