const currentYear = new Date().getFullYear();

export const YEARS = Array.from(
  { length: currentYear - 1930 + 1 },
  (_, i) => currentYear - i
);

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia'
];

export const MAKES_MODELS: Record<string, string[]> = {
  'Acura': ['ILX', 'TLX', 'RLX', 'MDX', 'RDX', 'NSX', 'Integra', 'TSX', 'Legend'],
  'Alfa Romeo': ['Giulia', 'Stelvio', '4C', 'Spider', 'GTV'],
  'Aston Martin': ['DB11', 'DBS', 'Vantage', 'DBX', 'Rapide'],
  'Audi': ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'R8', 'TT', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'RS3', 'RS5', 'RS6', 'RS7', 'RS Q8'],
  'BMW': ['2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX', 'M2', 'M3', 'M4', 'M5', 'M8', 'X3 M', 'X4 M', 'X5 M', 'X6 M'],
  'Bentley': ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne'],
  'Buick': ['Enclave', 'Encore', 'Encore GX', 'Envision', 'LaCrosse', 'Regal', 'Riviera'],
  'Cadillac': ['CT4', 'CT5', 'CT6', 'XT4', 'XT5', 'XT6', 'Escalade', 'LYRIQ', 'Eldorado', 'DeVille', 'CTS', 'ATS'],
  'Chevrolet': ['Spark', 'Sonic', 'Cruze', 'Malibu', 'Impala', 'Camaro', 'Corvette', 'Bolt', 'Trax', 'Equinox', 'Blazer', 'Traverse', 'Tahoe', 'Suburban', 'Colorado', 'Silverado 1500', 'Silverado 2500HD', 'Silverado 3500HD', 'Bel Air', 'Chevelle', 'Nova', 'El Camino'],
  'Chrysler': ['300', 'Pacifica', 'Voyager', 'PT Cruiser', 'Town & Country'],
  'Dodge': ['Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Ram 1500', 'Ram 2500', 'Ram 3500', 'Viper', 'Dart', 'Coronet', 'Super Bee'],
  'Ferrari': ['488', 'F8 Tributo', 'SF90', 'Roma', 'Portofino', '812 Superfast', 'F12', 'LaFerrari', 'Enzo'],
  'Fiat': ['500', '500X', '124 Spider'],
  'Ford': ['Fiesta', 'Focus', 'Fusion', 'Mustang', 'Mustang Mach-E', 'EcoSport', 'Escape', 'Edge', 'Explorer', 'Expedition', 'Bronco', 'Bronco Sport', 'Ranger', 'F-150', 'F-150 Lightning', 'F-250', 'F-350', 'Maverick', 'GT', 'Thunderbird', 'Galaxie', 'Fairlane', 'Torino'],
  'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
  'GMC': ['Terrain', 'Acadia', 'Yukon', 'Canyon', 'Sierra 1500', 'Sierra 2500HD', 'Sierra 3500HD', 'Hummer EV'],
  'Honda': ['Civic', 'Accord', 'Insight', 'Clarity', 'HR-V', 'CR-V', 'Passport', 'Pilot', 'Ridgeline', 'Odyssey', 'S2000', 'Prelude', 'CRX'],
  'Hyundai': ['Accent', 'Elantra', 'Sonata', 'Ioniq 5', 'Ioniq 6', 'Venue', 'Kona', 'Tucson', 'Santa Fe', 'Palisade', 'Veloster', 'Genesis Coupe'],
  'Infiniti': ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80', 'G35', 'G37'],
  'Jaguar': ['XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace'],
  'Jeep': ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Wagoneer', 'Grand Wagoneer', 'CJ-5', 'CJ-7'],
  'Kia': ['Rio', 'Forte', 'K5', 'Stinger', 'EV6', 'Soul', 'Seltos', 'Sportage', 'Sorento', 'Telluride', 'Carnival', 'Niro'],
  'Lamborghini': ['Huracán', 'Aventador', 'Urus', 'Gallardo', 'Murciélago'],
  'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'],
  'Lexus': ['IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX', 'LX', 'LFA'],
  'Lincoln': ['Corsair', 'Nautilus', 'Aviator', 'Navigator', 'Continental', 'Town Car'],
  'Lotus': ['Evora', 'Elise', 'Exige', 'Emira'],
  'Maserati': ['Ghibli', 'Quattroporte', 'Levante', 'MC20', 'GranTurismo'],
  'Mazda': ['Mazda3', 'Mazda6', 'MX-5 Miata', 'CX-3', 'CX-30', 'CX-5', 'CX-9', 'CX-50', 'CX-90', 'RX-7', 'RX-8'],
  'McLaren': ['570S', '720S', 'GT', 'Artura', 'P1'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'SL', 'SLC', 'AMG GT', 'EQS', 'EQE', 'EQB', '300SL', '190E'],
  'Mini': ['Cooper', 'Cooper Clubman', 'Cooper Countryman', 'Cooper Paceman'],
  'Mitsubishi': ['Mirage', 'Eclipse Cross', 'Outlander', 'Outlander Sport', 'Lancer Evolution', '3000GT'],
  'Nissan': ['Versa', 'Sentra', 'Altima', 'Maxima', 'Leaf', 'Ariya', 'Kicks', 'Rogue', 'Rogue Sport', 'Murano', 'Pathfinder', 'Armada', 'Frontier', 'Titan', '370Z', 'GT-R', '240SX', 'Skyline'],
  'Polestar': ['Polestar 1', 'Polestar 2', 'Polestar 3'],
  'Pontiac': ['GTO', 'Firebird', 'Trans Am', 'Grand Prix', 'Bonneville', 'Grand Am', 'Solstice', 'G6', 'G8'],
  'Porsche': ['718 Cayman', '718 Boxster', '911', 'Panamera', 'Macan', 'Cayenne', 'Taycan', 'Carrera GT', '928', '944'],
  'Ram': ['1500', '2500', '3500', 'ProMaster', 'ProMaster City'],
  'Rivian': ['R1T', 'R1S'],
  'Rolls-Royce': ['Ghost', 'Wraith', 'Dawn', 'Phantom', 'Cullinan'],
  'Subaru': ['Impreza', 'WRX', 'WRX STI', 'Legacy', 'Outback', 'Forester', 'Crosstrek', 'Ascent', 'BRZ', 'Solterra'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'Avalon', 'Prius', 'Prius Prime', 'bZ4X', 'C-HR', 'RAV4', 'RAV4 Prime', 'Venza', 'Highlander', '4Runner', 'Sequoia', 'Land Cruiser', 'Tacoma', 'Tundra', 'Sienna', 'GR86', 'Supra', 'Celica', 'MR2', 'FJ Cruiser'],
  'Volkswagen': ['Jetta', 'Passat', 'Arteon', 'Golf', 'GTI', 'Golf R', 'ID.4', 'Taos', 'Tiguan', 'Atlas', 'Beetle', 'Karmann Ghia', 'Bus', 'Thing'],
  'Volvo': ['S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40', '240', '850', 'P1800'],
  'Polaris': ['RZR XP 1000', 'RZR Pro XP', 'RZR Turbo S', 'RZR 900', 'Ranger 1000', 'Ranger XP 1000', 'General 1000', 'Sportsman 570', 'Sportsman 850'],
  'Can-Am': ['Maverick X3', 'Maverick Sport', 'Defender HD10', 'Commander XT', 'Outlander 850'],
  'Yamaha': ['YXZ1000R', 'Wolverine RMAX4 1000', 'Viking VI', 'Grizzly 700'],
  'Kawasaki': ['Teryx KRX 1000', 'Teryx4', 'Mule Pro-FXT'],
  'Honda (ATV/UTV)': ['Talon 1000X', 'Pioneer 1000', 'Rubicon 520'],
  'Plymouth': ['Road Runner', 'Barracuda', 'GTX', 'Fury', 'Duster', 'Satellite'],
  'Mercury': ['Cougar', 'Cyclone', 'Marauder', 'Grand Marquis'],
  'Oldsmobile': ['442', 'Cutlass', 'Toronado', 'Delta 88'],
  'AMC': ['Javelin', 'AMX', 'Gremlin', 'Pacer', 'Hornet'],
  'Studebaker': ['Avanti', 'Hawk', 'Lark', 'Champion'],
  'Hudson': ['Hornet', 'Commodore', 'Super Six'],
  'Packard': ['Caribbean', 'Clipper', 'Eight'],
  'DeLorean': ['DMC-12'],
  'Other': ['Custom Build', 'Kit Car', 'Replica', 'Unknown']
};

export const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'DCT'];

export const CONDITIONS = [
  'Excellent',
  'Good',
  'Fair',
  'Poor',
  'Project Car',
  'Parts Only'
];

export const VEHICLE_TYPES = [
  'Sedan',
  'Coupe',
  'Convertible',
  'SUV',
  'Truck',
  'Van/Minivan',
  'Wagon',
  'Hatchback',
  'Sports Car',
  'Classic/Muscle',
  'Hybrid/EV',
  'Off-Road/4x4',
  'Side-by-Side/UTV'
];
