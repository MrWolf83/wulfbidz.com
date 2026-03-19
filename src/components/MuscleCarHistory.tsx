import { Car, Award, TrendingUp, Calendar } from 'lucide-react';

export default function MuscleCarHistory() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 rounded-lg p-8 mb-8">
      <div className="mb-8 text-center">
        <h3 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
          <Car className="w-8 h-8 text-red-500" />
          The Golden Era of American Muscle Cars
        </h3>
        <p className="text-gray-400 max-w-3xl mx-auto">
          Discover the legendary vehicles that defined an era of raw power, distinctive styling, and automotive passion
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 transition-colors">
          <Calendar className="w-8 h-8 text-red-500 mb-4" />
          <h4 className="text-xl font-bold text-white mb-3">The Era (1964-1974)</h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            The muscle car era began in 1964 with the Pontiac GTO and reached its peak between 1968-1970.
            These high-performance vehicles featured powerful V8 engines in mid-size bodies, offering incredible
            acceleration at affordable prices. The era ended in the mid-1970s due to emissions regulations,
            insurance costs, and the oil crisis.
          </p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 transition-colors">
          <TrendingUp className="w-8 h-8 text-red-500 mb-4" />
          <h4 className="text-xl font-bold text-white mb-3">Production Numbers</h4>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            Muscle car production varied widely. Some rare examples:
          </p>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• 1969 Dodge Charger Daytona: 503 units</li>
            <li>• 1970 Plymouth Hemi Cuda: 666 units</li>
            <li>• 1969 Chevrolet Camaro ZL1: 69 units</li>
            <li>• 1970 Chevelle SS 454 LS6: 4,475 units</li>
            <li>• 1971 Plymouth Hemi Cuda Convertible: 11 units</li>
          </ul>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-red-500 transition-colors">
          <Award className="w-8 h-8 text-red-500 mb-4" />
          <h4 className="text-xl font-bold text-white mb-3">What Makes Them Unique</h4>
          <p className="text-gray-300 text-sm leading-relaxed">
            Muscle cars combined affordable pricing with straight-line performance. They featured large-displacement
            V8 engines (often 400+ cubic inches), aggressive styling, and minimal luxury features to keep weight down.
            Their cultural impact, soundtrack, and raw driving experience created an automotive legend that continues
            to captivate enthusiasts worldwide.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-2xl font-bold text-white mb-4 text-center">Most Sought-After Models</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6">
            <h5 className="text-lg font-bold text-red-500 mb-4">Chevrolet Legends</h5>
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <p className="font-semibold text-white">1969-1970 Chevrolet Camaro Z/28 & ZL1</p>
                <p className="text-gray-400">The Z/28 dominated Trans-Am racing, while the ultra-rare ZL1 featured an aluminum 427 engine.
                Only 69 ZL1s were built, making them among the most valuable muscle cars today.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1970 Chevelle SS 454 LS6</p>
                <p className="text-gray-400">Rated at 450 HP (likely underrated), the LS6 was the king of big-block Chevelles.
                The 1970 model year is most desirable before horsepower ratings dropped.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1969 Chevrolet Corvette ZL1</p>
                <p className="text-gray-400">Only two factory ZL1 Corvettes were built, making them virtually priceless collector pieces.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6">
            <h5 className="text-lg font-bold text-red-500 mb-4">Mopar Muscle</h5>
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <p className="font-semibold text-white">1970-1971 Plymouth Hemi Cuda & Dodge Challenger R/T Hemi</p>
                <p className="text-gray-400">The 426 Hemi engine was legendary for its power. Convertible versions are especially rare,
                with some selling for over $3 million at auction.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1969 Dodge Charger Daytona & 1970 Plymouth Superbird</p>
                <p className="text-gray-400">Built for NASCAR homologation with massive rear wings and nose cones. The Daytona (503 built)
                and Superbird (1,935 built) are iconic aero warriors.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1968-1970 Dodge Charger R/T</p>
                <p className="text-gray-400">Immortalized in "Bullitt" and "The Dukes of Hazzard," the second-gen Charger is one of
                the most recognizable muscle cars ever made.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6">
            <h5 className="text-lg font-bold text-red-500 mb-4">Ford Performance</h5>
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <p className="font-semibold text-white">1967-1968 Shelby GT500</p>
                <p className="text-gray-400">Carroll Shelby's high-performance Mustangs featured 428 Cobra Jet engines.
                The Eleanor tribute cars from "Gone in 60 Seconds" boosted their popularity.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1969-1970 Ford Mustang Boss 429</p>
                <p className="text-gray-400">Built to homologate the 429 Hemi for NASCAR, only 1,358 were produced over two years.
                Featured extensively modified suspensions and are highly collectible.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1970 Ford Torino Cobra</p>
                <p className="text-gray-400">Featured the 429 Cobra Jet engine in a sleek fastback body. Less common than Mustangs
                but equally powerful.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-red-500/30 rounded-lg p-6">
            <h5 className="text-lg font-bold text-red-500 mb-4">Pontiac & Others</h5>
            <div className="space-y-3 text-gray-300 text-sm">
              <div>
                <p className="font-semibold text-white">1964-1967 Pontiac GTO</p>
                <p className="text-gray-400">Widely considered the first true muscle car. The 1964 model started the movement,
                while 1967 models featured the most aggressive styling.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1969 Pontiac Firebird Trans Am</p>
                <p className="text-gray-400">Only 689 first-generation Trans Ams were built in 1969, featuring Ram Air engines
                and distinctive styling.</p>
              </div>
              <div>
                <p className="font-semibold text-white">1970 Buick GSX</p>
                <p className="text-gray-400">Buick's muscle car featured a 455 Stage 1 engine with massive torque.
                Only 678 were built, making them rare and desirable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
        <h4 className="text-xl font-bold text-white mb-4">Peak Performance Years: 1968-1970</h4>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          The absolute peak of the muscle car era occurred between 1968 and 1970, before emissions regulations and
          insurance industry backlash forced manufacturers to detune engines. During these three years:
        </p>
        <ul className="grid md:grid-cols-2 gap-3 text-gray-400 text-sm">
          <li>• Engine compression ratios reached 11:1 or higher</li>
          <li>• Factory horsepower ratings exceeded 450 HP (often underrated)</li>
          <li>• Quarter-mile times dipped into the 12-second range (some high-11s)</li>
          <li>• Premium gasoline was affordable and widely available</li>
          <li>• Insurance premiums hadn't yet skyrocketed for young drivers</li>
          <li>• Factory warranty coverage included racing components</li>
        </ul>
      </div>

      <div className="bg-gradient-to-r from-red-900/20 to-gray-800 border border-red-500/30 rounded-lg p-6">
        <h4 className="text-xl font-bold text-white mb-3">Investment & Value</h4>
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          Original, numbers-matching muscle cars from the golden era have become serious investments. Key factors affecting value:
        </p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-red-500 mb-2">Documentation</p>
            <p className="text-gray-400">Original build sheets, window stickers, and ownership history can increase value by 30-50%</p>
          </div>
          <div>
            <p className="font-semibold text-red-500 mb-2">Matching Numbers</p>
            <p className="text-gray-400">Original engine, transmission, and rear axle codes matching factory records are essential for top dollar</p>
          </div>
          <div>
            <p className="font-semibold text-red-500 mb-2">Rarity</p>
            <p className="text-gray-400">Low production numbers, special options, and unusual color combinations command premium prices</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mt-4">
          Some rare muscle cars have appreciated over 1,000% in the past 20 years, with six-figure values becoming common
          for pristine examples. The most desirable models regularly sell for $200,000-$500,000, with exceptional pieces
          exceeding $1 million at prestigious auctions.
        </p>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm italic">
          WulfBidz connects collectors with authentic muscle cars from the golden era. Every listing is verified
          for accuracy, helping preserve automotive history for future generations.
        </p>
      </div>
    </div>
  );
}
