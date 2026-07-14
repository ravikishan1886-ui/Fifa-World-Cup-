import { useState, useEffect } from 'react';
import { Message, SupportedLanguage } from './types';
import { StadiumMap } from './components/StadiumMap';
import { NavigationControls } from './components/NavigationControls';
import { ChatAssistant } from './components/ChatAssistant';
import { 
  Compass, 
  Accessibility, 
  Settings, 
  Sparkles, 
  ShieldAlert, 
  Sliders, 
  AlertTriangle, 
  Check, 
  Users,
  Volume2
} from 'lucide-react';

export default function App() {
  // Routing State
  const [origin, setOrigin] = useState<string>('gate_a');
  const [destination, setDestination] = useState<string>('block_102');
  const [stepFreeOnly, setStepFreeOnly] = useState<boolean>(false);
  const [pathResult, setPathResult] = useState<any>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Accessibility Enhanced view
  const [accessibilityMode, setAccessibilityMode] = useState<boolean>(false);

  // Crowd simulation state (north, south, east, west)
  const [crowdLevels, setCrowdLevels] = useState<Record<string, 'low' | 'medium' | 'high'>>({
    north: 'low',
    south: 'low',
    east: 'low',
    west: 'low',
  });
  const [showCrowdPanel, setShowCrowdPanel] = useState<boolean>(false);

  // Chat Assistant State
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('auto');
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);

  // Diagnostic Test States
  const [testResults, setTestResults] = useState<any>(null);
  const [testingLoading, setTestingLoading] = useState<boolean>(false);
  const [showTestPanel, setShowTestPanel] = useState<boolean>(false);

  const runDiagnostics = async () => {
    setTestingLoading(true);
    setShowTestPanel(true);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      setTestResults(data);
    } catch (err: any) {
      setTestResults({
        success: false,
        results: [{ testName: "Diagnostic endpoint query", passed: false, message: err.message }]
      });
    } finally {
      setTestingLoading(false);
    }
  };

  // Sync accessibility mode with stepFreeOnly
  useEffect(() => {
    if (accessibilityMode) {
      setStepFreeOnly(true);
    }
  }, [accessibilityMode]);

  // Load initial crowd levels from backend
  useEffect(() => {
    fetch('/api/crowd')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.north) {
          setCrowdLevels(data);
        }
      })
      .catch((err) => console.warn('Could not sync initial crowd status:', err));
  }, []);

  // Initialize with a welcome message from the assistant
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'welcome-1',
        sender: 'assistant',
        text: "👋 Welcome to World Cup 2026! I am Compass26, your stadium pilot.\n\nHow can I help you find your seat, locate restrooms, or navigate facilities today? You can choose a starting gate and seat block below, or capture/attach a photo of your ticket or any signs around you, and I will instantly plot the best route!",
        timestamp: timeStr,
      },
    ]);
  }, []);

  // Sync crowd updates with backend and recalculate routes if needed
  const handleUpdateCrowdLevel = async (zone: string, density: 'low' | 'medium' | 'high') => {
    const nextLevels = { ...crowdLevels, [zone]: density };
    setCrowdLevels(nextLevels);

    try {
      await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextLevels),
      });

      // Recalculate route live on screen if we have start and ends
      if (origin && destination) {
        handleCalculateRoute(origin, destination, stepFreeOnly, nextLevels);
      }
    } catch (err) {
      console.warn('Backend crowd update failed:', err);
    }
  };

  // Trigger Dijkstra route calculations via the Express backend API
  const handleCalculateRoute = async (
    startNode = origin,
    endNode = destination,
    forceStepFree = stepFreeOnly,
    overrideCrowds = crowdLevels
  ) => {
    if (!startNode || !endNode) return;
    setRoutingError(null);

    try {
      const response = await fetch('/api/shortest-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          origin: startNode, 
          destination: endNode, 
          stepFreeOnly: forceStepFree,
          crowdLevels: overrideCrowds
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to compute route on the server.');
      }

      const data = await response.json();
      if (data.result) {
        setPathResult(data.result);
      } else {
        setPathResult(null);
        setRoutingError('No path found. The destination may be inaccessible under step-free constraints.');
      }
    } catch (err: any) {
      setRoutingError(err.message || 'Error occurred while contacting the navigation server.');
    }
  };

  // Quick reset router fields
  const handleResetRouter = () => {
    setOrigin('');
    setDestination('');
    setStepFreeOnly(accessibilityMode ? true : false);
    setPathResult(null);
    setRoutingError(null);
  };

  // Map click selector logic
  const handleSelectNodeFromMap = (nodeId: string) => {
    if (!origin) {
      setOrigin(nodeId);
      // Auto-recalculate if destination was already chosen
      if (destination) {
        handleCalculateRoute(nodeId, destination, stepFreeOnly);
      }
    } else if (origin && !destination) {
      if (origin === nodeId) {
        setOrigin(''); // clear if clicking the same node
      } else {
        setDestination(nodeId);
        handleCalculateRoute(origin, nodeId, stepFreeOnly);
      }
    } else {
      // both filled, start over with origin
      setOrigin(nodeId);
      setDestination('');
      setPathResult(null);
    }
  };

  // Trigger route straight from a button inside the chat thread
  const handleTriggerRouteFromChat = (originId: string, destId: string) => {
    setOrigin(originId);
    setDestination(destId);
    handleCalculateRoute(originId, destId, stepFreeOnly);
  };

  // Send Chat to server proxy and call Gemini
  const handleSendMessage = async (text: string, base64Image?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: timeStr,
      image: base64Image,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setChatLoading(true);
    setApiKeyError(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          currentLanguage,
          accessibilityMode,
        }),
      });

      if (response.status === 401) {
        setApiKeyError(true);
        const aiOfflineMsg: Message = {
          id: `sys-${Date.now()}`,
          sender: 'system',
          text: "⚙️ SIMULATION MODE ACTIVE: Compass26 is running locally with full navigation. To activate the multimodal Gemini chat AI, go to Settings > Secrets in the AI Studio UI and configure GEMINI_API_KEY with a valid Google AI Studio key.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiOfflineMsg]);
        setChatLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Stadium server failed to reply.');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `sys-${Date.now()}`,
        sender: 'system',
        text: `⚠️ Navigation link lost: ${err.message || 'Service temporarily offline'}. Simulation mode is active. You can still use the map and route calculators offline.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setChatLoading(false);
    }
  };

  // Run a preset demonstration scenario directly!
  const runDemoScenario = async (scenarioKey: string) => {
    setRoutingError(null);
    setPathResult(null);

    if (scenarioKey === 'lost_fan') {
      // Fan lost looking for Gate C
      setCurrentLanguage('auto');
      setOrigin('block_101');
      setDestination('gate_c');
      setStepFreeOnly(false);
      setAccessibilityMode(false);
      
      // Update crowd levels to normal
      const cleanCrowds = { north: 'low', south: 'low', east: 'low', west: 'low' };
      setCrowdLevels(cleanCrowds);
      await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanCrowds),
      });

      handleCalculateRoute('block_101', 'gate_c', false, cleanCrowds);
      handleSendMessage("I am lost near Seating Block 101 and looking for Gate C.");

    } else if (scenarioKey === 'wheelchair_user') {
      // Wheelchair user needing fastest step-free route
      setAccessibilityMode(true);
      setStepFreeOnly(true);
      setOrigin('gate_a');
      setDestination('block_102');
      setCurrentLanguage('auto');

      const cleanCrowds = { north: 'low', south: 'low', east: 'low', west: 'low' };
      setCrowdLevels(cleanCrowds);
      await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanCrowds),
      });

      handleCalculateRoute('gate_a', 'block_102', true, cleanCrowds);
      handleSendMessage("I am in a wheelchair and need the fastest step-free route to Block 102.");

    } else if (scenarioKey === 'spanish_speaker') {
      // Spanish speaker needing nearest restroom
      setCurrentLanguage('es');
      setOrigin('block_105');
      setDestination('restroom_ne');
      setStepFreeOnly(false);
      setAccessibilityMode(false);

      const cleanCrowds = { north: 'low', south: 'low', east: 'low', west: 'low' };
      setCrowdLevels(cleanCrowds);
      await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanCrowds),
      });

      handleCalculateRoute('block_105', 'restroom_ne', false, cleanCrowds);
      handleSendMessage("¿Dónde está el baño más cercano?");

    } else if (scenarioKey === 'crowd_surge') {
      // Live crowd surge at north gate triggering reroute
      setCurrentLanguage('auto');
      setOrigin('gate_b');
      setDestination('block_105');
      setStepFreeOnly(false);
      setAccessibilityMode(false);

      const busyNorth = { north: 'high', south: 'low', east: 'low', west: 'low' };
      setCrowdLevels(busyNorth);
      await fetch('/api/crowd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(busyNorth),
      });

      handleCalculateRoute('gate_b', 'block_105', false, busyNorth);
      handleSendMessage("Route me from Gate B to Block 105.");
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans antialiased transition-all ${accessibilityMode ? 'text-lg bg-slate-100' : 'text-sm'}`}>
      
      {/* Top Banner Branding */}
      <header className={`bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs ${accessibilityMode ? 'border-b-2 border-slate-900' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/10">
              <Compass className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="text-left">
              <span className="text-[10px] font-black text-blue-600 tracking-tight uppercase block -mb-0.5">Compass26</span>
              <span className="text-lg font-black text-slate-800 tracking-tight">World Cup Assistant</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* System Diagnostics Trigger */}
            <button
              id="diagnostics-test-button"
              onClick={runDiagnostics}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all cursor-pointer ${
                showTestPanel 
                  ? 'bg-green-100 border-green-300 text-green-950 shadow-md' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Check className="w-4 h-4 text-green-600" />
              <span>DIAGNOSTICS</span>
            </button>

            {/* Accessibility Enhancer Badge toggle */}
            <button
              onClick={() => setAccessibilityMode(!accessibilityMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-black transition-all cursor-pointer ${
                accessibilityMode 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Accessibility className="w-4 h-4" />
              <span>{accessibilityMode ? 'ACCESSIBILITY ACTIVE' : 'ACCESSIBILITY'}</span>
            </button>

            {/* Simulated Live Crowd Indicator Gear/Sliders */}
            <button
              onClick={() => setShowCrowdPanel(!showCrowdPanel)}
              className={`flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-xs font-black ${
                showCrowdPanel 
                  ? 'bg-amber-100 border-amber-300 text-amber-900' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>CROWD LIVE</span>
              <Settings className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showCrowdPanel ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* System Diagnostics Test Panel Drawer */}
      {showTestPanel && (
        <div className="bg-green-50/70 border-b border-green-200 py-4 shadow-inner text-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <h3 className="text-xs font-black text-green-900 tracking-wider uppercase flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-600" /> System Integrity & Dijkstra Pathfinding Tests
                  </h3>
                  <p className="text-[11px] text-green-700 font-medium leading-relaxed mt-0.5">
                    Automatically verifies navigation engine accuracy, accessibility locks, and crowd density algorithms.
                  </p>
                </div>
                <button
                  onClick={() => setShowTestPanel(false)}
                  className="bg-white/50 hover:bg-white text-green-800 border border-green-200 px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all"
                >
                  Close Panel
                </button>
              </div>

              {testingLoading ? (
                <div className="text-left py-2 flex items-center gap-2 text-xs font-bold text-green-800">
                  <div className="w-4 h-4 rounded-full border-2 border-green-600 border-t-transparent animate-spin"></div>
                  <span>Running automated routing assertions and integrity tests...</span>
                </div>
              ) : testResults ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                  {testResults.results?.map((res: any, idx: number) => (
                    <div key={idx} className="bg-white border border-green-100 p-3 rounded-xl shadow-xs text-left flex flex-col justify-between">
                      <div>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${res.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {res.passed ? 'Passed ✓' : 'Failed ✗'}
                        </span>
                        <h4 className="text-xs font-bold text-slate-800 mt-2 leading-tight">{res.testName}</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1.5">
                        {res.message}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Live Crowd Control Panel Drawer */}
      {showCrowdPanel && (
        <div className="bg-amber-50/50 border-b border-amber-200 py-4 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="text-left">
                <h3 className="text-xs font-black text-amber-900 tracking-wider uppercase flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-600" /> Live Zone Density Simulator
                </h3>
                <p className="text-[11px] text-amber-700 font-medium leading-relaxed mt-0.5">
                  Simulate high-density fan surges in any sector. High density adds Dijkstra route penalties, forcing the AI assistant to dynamically calculate routes avoiding congested zones.
                </p>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                {['north', 'south', 'east', 'west'].map((zone) => (
                  <div key={zone} className="bg-white border border-amber-200 p-2.5 rounded-xl shadow-xs text-left">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{zone} zone</span>
                    <div className="flex gap-1 mt-1.5">
                      {(['low', 'medium', 'high'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => handleUpdateCrowdLevel(zone, lvl)}
                          className={`flex-1 text-[10px] font-black py-1 px-1.5 rounded-md uppercase tracking-tight transition-all border cursor-pointer ${
                            crowdLevels[zone] === lvl
                              ? lvl === 'high'
                                ? 'bg-red-600 border-red-600 text-white'
                                : lvl === 'medium'
                                ? 'bg-amber-500 border-amber-500 text-white'
                                : 'bg-green-600 border-green-600 text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Dynamic Demo Preset Scenarios Menu */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Interactive Demonstration Presets</h3>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mb-4">
            Click any demo scenario to instantly load preset locations, trigger corresponding routing calculations, configure live crowd conditions, and send pre-formulated queries to the multimodal Gemini assistant.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            <button
              onClick={() => runDemoScenario('lost_fan')}
              className="text-left bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group"
            >
              <div>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-fit mb-1.5">Scenario 1</span>
                <p className="font-black text-slate-800 text-xs leading-snug group-hover:text-blue-600 transition-colors">Lost Fan (Gate C)</p>
                <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1">Stuck near Seat Block 101; queries directions to exit Gate C.</p>
              </div>
            </button>

            <button
              onClick={() => runDemoScenario('wheelchair_user')}
              className="text-left bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group"
            >
              <div>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-fit mb-1.5">Scenario 2</span>
                <p className="font-black text-slate-800 text-xs leading-snug group-hover:text-blue-600 transition-colors">Wheelchair Navigation</p>
                <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1">Forces step-free Dijkstra, activates large text UI & speech engine.</p>
              </div>
            </button>

            <button
              onClick={() => runDemoScenario('spanish_speaker')}
              className="text-left bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group"
            >
              <div>
                <span className="text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-fit mb-1.5">Scenario 3</span>
                <p className="font-black text-slate-800 text-xs leading-snug group-hover:text-blue-600 transition-colors">Spanish Speaker</p>
                <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1">Asks for closest restroom; Gemini translates response to Spanish.</p>
              </div>
            </button>

            <button
              onClick={() => runDemoScenario('crowd_surge')}
              className="text-left bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between h-28 group"
            >
              <div>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black uppercase tracking-wider block w-fit mb-1.5">Scenario 4</span>
                <p className="font-black text-slate-800 text-xs leading-snug group-hover:text-amber-600 transition-colors">Crowd Surge Reroute</p>
                <p className="text-[10px] text-slate-400 font-medium leading-snug mt-1">Locks North zone as high crowd density; Dijkstra automatically reroutes around it!</p>
              </div>
            </button>

          </div>
        </div>
        
        {/* API Key Missing Alert Banner */}
        {apiKeyError && (
          <div className="bg-blue-50/30 border border-blue-200 rounded-2xl p-4 flex gap-3 shadow-xs max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider">Multimodal AI Simulation Active</h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-0.5 font-semibold">
                The stadium assistant has booted into local routing mode because a valid <strong className="font-bold text-slate-800">GEMINI_API_KEY</strong> secret has not been provided yet. You can still use the fully interactive stadium map and calculate Dijkstra routes. To enable live multimodal ticket parsing and multilingual chat, configure your API Key in the <strong className="font-bold text-slate-800">Settings &gt; Secrets</strong> panel.
              </p>
            </div>
          </div>
        )}

        {/* Dashboard Grid - Two Panels on Desktop / Single Column Stack on Mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Interactive Map & Controls (Dijkstra) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Map visualizer */}
            <StadiumMap
              activePath={pathResult ? pathResult.path : null}
              originNodeId={origin}
              destNodeId={destination}
              onSelectNode={handleSelectNodeFromMap}
              stepFreeOnly={stepFreeOnly}
            />

            {/* Router Inputs */}
            <NavigationControls
              origin={origin}
              destination={destination}
              stepFreeOnly={stepFreeOnly}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onStepFreeToggle={setStepFreeOnly}
              onCalculate={() => handleCalculateRoute(origin, destination, stepFreeOnly)}
              onReset={handleResetRouter}
              pathResult={pathResult}
              errorMsg={routingError}
            />
          </div>

          {/* Right Column: Multimodal Multilingual Chat Assistant */}
          <div className="lg:col-span-5">
            <ChatAssistant
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={chatLoading}
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              onTriggerRoute={handleTriggerRouteFromChat}
              accessibilityMode={accessibilityMode}
            />
          </div>
        </div>
      </main>

      {/* Modern, clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-slate-400 text-xs font-semibold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="flex items-center gap-1.5 text-left">
            <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
            <span>Compass26 Stadium pilot. Built for World Cup Host Stadium Visitors.</span>
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-black border border-blue-100">Dijkstra Nav v1.1</span>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-black">100% Client + Server Integration</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
