import Image from "next/image";

export default function HeroPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-primary-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-6 mt-8 sm:mt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-900 dark:text-primary-50 leading-tight">
              Community-Based
              <span className="text-primary-600 dark:text-primary-400 block">
                Investing in Indexes
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0">
              Invest in a pool of companies, vote for your favorites, and let the community decide the final index. Funds are equally distributed across top-voted companies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a
                href="/register"
                className="rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all duration-200 font-semibold text-base px-8 py-4 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </a>
              <a
                href="/learn-more"
                className="rounded-full border-2 border-primary-600 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white transition-all duration-200 font-semibold text-base px-8 py-4 flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-12 text-center">
              <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-1 border-primary-100 dark:border-primary-800">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">4</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
              </div>
              <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-1 border-primary-100 dark:border-primary-800">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">$0+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Invested</div>
              </div>
              <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-1 border-primary-100 dark:border-primary-800 sm:col-span-1 col-span-2">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Companies</div>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] hidden sm:flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-primary-500/5 dark:from-primary-500/20 dark:to-primary-500/10 rounded-3xl transform rotate-3"></div>
            <Image
              src="/hero-image.svg"
              alt="3d Illustration"
              fill
              className="object-contain p-8 transform -rotate-3 hover:rotate-0 transition-transform duration-500"
              priority
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-primary-600 dark:text-primary-400 text-xl font-semibold mb-3">Community Driven</div>
            <p className="text-gray-600 dark:text-gray-300">Vote and participate in index creation with our active community.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-primary-600 dark:text-primary-400 text-xl font-semibold mb-3">Transparent</div>
            <p className="text-gray-600 dark:text-gray-300">Clear voting process and fund distribution mechanisms.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-primary-600 dark:text-primary-400 text-xl font-semibold mb-3">Accessible</div>
            <p className="text-gray-600 dark:text-gray-300">Start investing with any amount and grow your portfolio.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
