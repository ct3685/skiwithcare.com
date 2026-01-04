import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'

function App() {
  const { colorTheme, darkMode } = useSettingsStore()

  // Apply theme classes to document
  useEffect(() => {
    const root = document.documentElement
    
    // Remove all theme classes
    root.classList.remove('theme-rose', 'theme-alpine', 'theme-glacier', 'light-theme', 'dark-theme')
    
    // Apply color theme
    root.classList.add(`theme-${colorTheme}`)
    
    // Apply dark/light mode
    if (darkMode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.add(prefersDark ? 'dark-theme' : 'light-theme')
    } else {
      root.classList.add(`${darkMode}-theme`)
    }
  }, [colorTheme, darkMode])

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-512.png" 
              alt="SkiWithCare" 
              className="w-12 h-12 rounded-xl shadow-glow-pink"
            />
            <div>
              <h1 className="text-lg font-bold">
                <span className="text-[#e879a0]">Ski</span>
                <span className="text-[#64d9f7]">WithCare</span>
              </h1>
              <span className="text-xs text-text-muted">Care Near the Slopes</span>
            </div>
          </div>
          
          {/* Mode Toggle Placeholder */}
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-pill bg-accent-primary text-white font-semibold">
              Resorts
            </button>
            <button className="px-4 py-2 rounded-pill bg-bg-tertiary text-text-muted font-semibold">
              Clinics
            </button>
            <button className="px-4 py-2 rounded-pill bg-bg-tertiary text-text-muted font-semibold">
              Hospitals
            </button>
          </div>

          {/* Settings Gear Placeholder */}
          <button className="p-2 rounded-lg bg-bg-tertiary hover:bg-bg-card transition-colors">
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-66px)]">
        {/* Sidebar */}
        <aside className="w-96 bg-bg-secondary border-r border-border p-4 overflow-y-auto">
          <div className="mb-4">
            <input 
              type="text"
              placeholder="Search resorts..."
              className="w-full px-4 py-3 rounded-lg bg-bg-tertiary border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>
          
          {/* Placeholder Cards */}
          <div className="space-y-3">
            {['Vail', 'Breckenridge', 'Park City', 'Aspen Snowmass', 'Jackson Hole'].map((resort) => (
              <div 
                key={resort}
                className="p-4 rounded-lg bg-bg-card border border-border hover:border-accent-primary cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">🏔️ {resort}</span>
                  <span className="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-muted">CO</span>
                </div>
                <div className="mt-2 text-sm text-text-secondary">
                  <span className="text-accent-success">🏥 12.5 mi</span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-text-muted text-sm">
            🚧 React rebuild in progress...
          </p>
        </aside>

        {/* Map Placeholder */}
        <div className="flex-1 bg-bg-tertiary flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-xl font-semibold text-text-primary">Map Coming Soon</h2>
            <p className="text-text-muted">Leaflet integration in progress</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

