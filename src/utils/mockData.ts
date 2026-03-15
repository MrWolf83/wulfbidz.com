export const MOCK_CARS = [
  {
    year: 1967,
    make: 'Ford',
    model: 'Mustang',
    trim: 'Fastback',
    mileage: 45000,
    vin: '7R01C123456',
    starting_bid: 75000,
    description: 'Restored 1967 Ford Mustang Fastback. Original 289 V8 engine, 4-speed manual transmission. Recent restoration with original sheet metal. New paint in Acapulco Blue. Black vinyl interior in excellent condition.',
    photos: ['/1967-Ford-Mustang-Eleanor-Exterior-003-Front-ChromeCars.jpg'],
  },
  {
    year: 1969,
    make: 'Chevrolet',
    model: 'Camaro',
    trim: 'SS',
    mileage: 52000,
    vin: '124379N500001',
    starting_bid: 65000,
    description: 'Numbers matching 1969 Camaro SS with 396 big block. Rally Sport package with hideaway headlights. Factory Hugger Orange paint. Black interior with console. Original build sheet included.',
    photos: [],
  },
  {
    year: 1970,
    make: 'Plymouth',
    model: 'Barracuda',
    trim: '340',
    mileage: 38000,
    vin: 'BH23H0B123456',
    starting_bid: 58000,
    description: 'Rare 1970 Plymouth Barracuda with 340 engine and 4-speed. In Lime Light green with black strobe stripes. Original broadcast sheet. Documented ownership history. Recent mechanical refresh.',
    photos: [],
  },
  {
    year: 1963,
    make: 'Chevrolet',
    model: 'Corvette',
    trim: 'Split Window',
    mileage: 71000,
    vin: '30837S100001',
    starting_bid: 125000,
    description: 'Iconic 1963 Split Window Corvette. 327/340hp V8 with 4-speed manual. Silver Blue exterior, black interior. Matching numbers. Recently serviced, runs excellent. Investment grade classic.',
    photos: [],
  },
  {
    year: 1971,
    make: 'Dodge',
    model: 'Challenger',
    trim: 'R/T',
    mileage: 44000,
    vin: 'JS23N1B123456',
    starting_bid: 72000,
    description: 'Pristine 1971 Dodge Challenger R/T. 440 Magnum engine, automatic transmission. In B5 Blue with white interior. Shaker hood, power steering, power brakes. Documented with fender tag.',
    photos: [],
  },
];

export const MOCK_USERNAMES = [
  'ClassicCarCollector',
  'VintageRides',
  'MuscleCarFan',
  'RestoreKing',
  'ChromeHunter',
  'V8Dreams',
  'CruisinClassics',
  'RetroWheels',
  'GarageGold',
  'TimelessAutos',
];

export function getRandomMockCar() {
  return MOCK_CARS[Math.floor(Math.random() * MOCK_CARS.length)];
}

export function getRandomUsername() {
  return MOCK_USERNAMES[Math.floor(Math.random() * MOCK_USERNAMES.length)];
}

export function generateRandomBidAmount(startingBid: number) {
  const increment = Math.floor(Math.random() * 5000) + 1000;
  return startingBid + increment;
}
