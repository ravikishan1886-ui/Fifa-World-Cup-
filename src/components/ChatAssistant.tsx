import React, { useState, useRef, useEffect } from 'react';
import { Message, SupportedLanguage } from '../types';
import { stadiumGraph } from '../venueGraph';
import { 
  Send, 
  Camera, 
  Bot, 
  User, 
  FileImage, 
  Compass, 
  Sparkles,
  RefreshCw,
  X,
  Plus,
  Volume2,
  VolumeX,
  MonitorPlay,
  RotateCcw,
  Languages
} from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface ChatAssistantProps {
  messages: Message[];
  onSendMessage: (text: string, base64Image?: string) => void;
  isLoading: boolean;
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  onTriggerRoute: (origin: string, destination: string) => void;
  accessibilityMode: boolean;
}

// Simulated stadium signboards & ticket presets with non-English labels for easy testing of translation!
const CAMERA_PRESETS = [
  {
    name: '🇸🇵 Spanish: Sala de Primeros Auxilios',
    description: 'First Aid signboard in Sector Este',
    text: 'Spanish Signboard',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="%2310b981" rx="12"/>
      <rect x="15" y="15" width="370" height="170" fill="none" stroke="%23ffffff" stroke-width="3" rx="8"/>
      <circle cx="200" cy="70" r="30" fill="%23ffffff"/>
      <path d="M 200,55 V 85 M 185,70 H 215" stroke="%2310b981" stroke-width="10" stroke-linecap="square"/>
      <text x="200" y="135" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="20" text-anchor="middle">SALA DE PRIMEROS AUXILIOS</text>
      <text x="200" y="165" fill="%23ffffff" font-family="sans-serif" font-size="14" text-anchor="middle">SECTOR ESTE (EAST WING)</text>
    </svg>`
  },
  {
    name: '🇸🇦 Arabic: VIP Gate Signboard',
    description: 'VIP Entrance signboard in Arabic',
    text: 'Arabic Signboard',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="%231e3a8a" rx="12"/>
      <rect x="15" y="15" width="370" height="170" fill="none" stroke="%23f59e0b" stroke-width="4" rx="8"/>
      <text x="200" y="85" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="28" text-anchor="middle">بوابة كبار الشخصيات</text>
      <text x="200" y="135" fill="%23f59e0b" font-family="sans-serif" font-weight="bold" font-size="22" text-anchor="middle">دخول خاص فقط</text>
    </svg>`
  },
  {
    name: '🇫🇷 French: Entrée Interdite Signboard',
    description: 'Security zone restricted entry in French',
    text: 'French Signboard',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="%23b91c1c" rx="12"/>
      <circle cx="200" cy="70" r="35" fill="none" stroke="%23ffffff" stroke-width="10"/>
      <line x1="175" y1="70" x2="225" y2="70" stroke="%23ffffff" stroke-width="10"/>
      <text x="200" y="145" fill="%23ffffff" font-family="sans-serif" font-weight="black" font-size="24" text-anchor="middle">ENTRÉE INTERDITE</text>
      <text x="200" y="175" fill="%23fca5a5" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">ZONE DE SÉCURITÉ DU STADE</text>
    </svg>`
  },
  {
    name: '🎟️ Premium Ticket (Block 102)',
    description: 'VIP seat ticket with Block 102 instructions',
    text: 'World Cup Ticket',
    image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
      <rect width="400" height="200" fill="%23191c26" rx="12"/>
      <rect x="10" y="10" width="380" height="180" fill="none" stroke="%23d97706" stroke-width="2" rx="8" stroke-dasharray="6,4"/>
      <circle cx="0" cy="100" r="15" fill="%230f172a"/>
      <circle cx="400" cy="100" r="15" fill="%230f172a"/>
      <text x="30" y="45" fill="%23d97706" font-family="sans-serif" font-weight="950" font-size="18" letter-spacing="1">WORLD CUP 2026 PASS</text>
      <text x="30" y="75" fill="%23ffffff" font-family="monospace" font-size="11">MATCH CATEGORY 1</text>
      <text x="30" y="115" fill="%2394a3b8" font-family="sans-serif" font-size="11">SEATING AREA</text>
      <text x="30" y="145" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="24">BLOCK 102</text>
      <text x="180" y="115" fill="%2394a3b8" font-family="sans-serif" font-size="11">ACCESS GATE</text>
      <text x="180" y="145" fill="%23d97706" font-family="sans-serif" font-weight="bold" font-size="24">GATE B</text>
      <line x1="300" y1="20" x2="300" y2="180" stroke="%23334155" stroke-width="2" stroke-dasharray="4,4"/>
      <text x="350" y="110" fill="%23d97706" font-family="sans-serif" font-weight="bold" font-size="14" transform="rotate(-90 350 110)">VIP TICKET</text>
    </svg>`
  }
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  messages,
  onSendMessage,
  isLoading,
  currentLanguage,
  onLanguageChange,
  onTriggerRoute,
  accessibilityMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageTranslateLoading, setImageTranslateLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Read aloud assistant replies automatically if accessibilityMode is on
  useEffect(() => {
    if (messages.length > 0 && accessibilityMode) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'assistant') {
        readAloudText(lastMsg.text);
      }
    }
  }, [messages, accessibilityMode]);

  const readAloudText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Clean up markdown elements for better narration quality
      const cleanText = text
        ? text.replace(/[*#_➔\n]/g, ' ').replace(/\s+/g, ' ')
        : '';
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Attempt to map language code
      let langCode = 'en-US';
      if (currentLanguage === 'es') langCode = 'es-ES';
      else if (currentLanguage === 'ar') langCode = 'ar-SA';
      else if (currentLanguage === 'fr') langCode = 'fr-FR';
      else if (currentLanguage === 'pt') langCode = 'pt-BR';
      
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    onSendMessage(inputText, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Real Camera capture
  const handleOpenCamera = async () => {
    setCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera stream access blocked (common inside iframe sandboxes). Loading Camera Simulator Mode.");
      setCameraError("Camera access disabled. Running in high-fidelity Scanner Simulator.");
    }
  };

  // Capture Base64 image from stream
  const handleCaptureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        handleSelectPhoto(dataUrl, "Live Photo Capture");
      }
    }
    handleCloseCamera();
  };

  const handleCloseCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCameraActive(false);
  };

  // Translate captured photo on fly and post as user message
  const handleSelectPhoto = async (base64Image: string, label: string) => {
    // Generate a unique user message containing the photo immediately
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-photo-${Date.now()}`;
    
    // Call translation endpoint to get overlay text
    setImageTranslateLoading(true);
    let extractedTranslation = "Translating...";

    try {
      const response = await fetch('/api/translate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          currentLanguage: currentLanguage === 'auto' ? 'en' : currentLanguage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        extractedTranslation = data.translation;
      } else {
        extractedTranslation = "Could not translate signboard text automatically.";
      }
    } catch (err: any) {
      extractedTranslation = "Translation server offline. (No Gemini Key configured)";
    } finally {
      setImageTranslateLoading(false);
    }

    // Append user query message with translation
    const userMessage: Message = {
      id: userMsgId,
      sender: 'user',
      text: `[Scanned Photo: ${label}] Translating signboard...`,
      timestamp: timeStr,
      image: base64Image,
      translationOverlay: extractedTranslation,
    };

    onSendMessage(`I scanned a stadium sign / ticket showing: "${label}". Please translate and provide instructions.`, base64Image);

    // Let's speak translation aloud if accessibility is on
    if (accessibilityMode && extractedTranslation) {
      setTimeout(() => {
        readAloudText(`Sign translation: ${extractedTranslation}`);
      }, 500);
    }
  };

  // Helper to find navigation links inside AI responses
  const parseNavigationButtons = (text: string) => {
    const foundNodes = stadiumGraph.nodes.filter(node => 
      text.toLowerCase().includes(node.name.toLowerCase()) || 
      text.toLowerCase().includes(node.id.replace('_', ' ').toLowerCase())
    );

    if (foundNodes.length < 2) return null;

    const gateNode = foundNodes.find(n => n.type === 'gate');
    const targetNode = foundNodes.find(n => n.type !== 'gate');

    if (gateNode && targetNode) {
      return (
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onTriggerRoute(gateNode.id, targetNode.id)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" /> Direct Route: {gateNode.name} ➔ {targetNode.name}
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative w-full h-[660px] bg-white rounded-[40px] border-[10px] border-slate-900 shadow-2xl flex flex-col overflow-hidden ${accessibilityMode ? 'border-slate-950 font-bold' : ''}`}>
      {/* Phone Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-5 bg-slate-900 rounded-b-2xl z-20"></div>

      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 pt-7 pb-3 px-5 flex items-center justify-between z-10 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="text-left">
            <span className="text-[9px] font-black tracking-tight text-blue-600 uppercase block leading-none">Compass26</span>
            <h1 className={`${accessibilityMode ? 'text-base' : 'text-xs'} font-black text-slate-800 tracking-tight leading-tight flex items-center gap-1`}>
              Lusail AI Steward <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {accessibilityMode && (
            <button 
              onClick={stopSpeaking}
              className="p-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
              title="Stop speech synthesis"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
          <LanguageSelector currentLanguage={currentLanguage} onChange={onLanguageChange} />
        </div>
      </div>

      {/* Live Camera Scanner Simulator / Stream Modal */}
      {cameraActive && (
        <div className="absolute inset-0 bg-slate-950 z-30 flex flex-col p-4 pt-10 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
              <span className="text-sm font-black uppercase tracking-wider">Compass26 Live Scanner</span>
            </div>
            <button onClick={handleCloseCamera} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Camera View Box */}
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
            {cameraStream ? (
              <>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button
                  onClick={handleCaptureSnapshot}
                  className="absolute bottom-6 w-16 h-16 rounded-full border-4 border-white bg-red-600 active:scale-95 transition-all shadow-lg flex items-center justify-center"
                />
              </>
            ) : (
              <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-400">
                  <MonitorPlay size={24} />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="text-xs font-bold text-slate-300">Scanner Simulator Active</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Browser camera feed is blocked or restricted. Select any of the real multi-lingual stadium signs below to simulate capturing it!
                  </p>
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Simulation Presets selection inside camera */}
          <div className="mt-4 space-y-2">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block text-left">Click to simulate camera capture:</span>
            <div className="grid grid-cols-2 gap-2">
              {CAMERA_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSelectPhoto(p.image, p.text);
                    handleCloseCamera();
                  }}
                  className="text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2.5 text-xs transition-all flex flex-col justify-between group"
                >
                  <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{p.name}</span>
                  <span className="text-[9px] text-slate-500 font-medium block mt-1">{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Messages Thread */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 ${accessibilityMode ? 'text-sm' : 'text-xs'}`}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="max-w-xs space-y-2">
              <h3 className={`${accessibilityMode ? 'text-base' : 'text-sm'} font-black text-slate-800`}>Ask Compass26</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Scan stadium tickets, ask for directions, find nearest restrooms or concessions, and request medical assist. Translations and high-contrast routes are fully active.
              </p>
            </div>

            <div className="w-full max-w-sm pt-4 border-t border-slate-200">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-left">Simulate Signboard / Ticket Scans</p>
              <div className="grid grid-cols-1 gap-2">
                {CAMERA_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPhoto(p.image, p.text)}
                    className="text-left bg-white hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-700 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="text-left">
                      <p className="text-slate-800 group-hover:text-blue-600 transition-colors font-bold">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.description}</p>
                    </div>
                    <span className="text-[10px] bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 font-bold px-2 py-1 rounded-md transition-all border border-slate-100">
                      Scan Sign
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender !== 'user' && (
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                  <Bot size={13} />
                </div>
              )}

              <div className="max-w-[85%] space-y-1">
                {/* Captured or Preset image */}
                {msg.image && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-w-[240px] shadow-sm bg-white p-1">
                    <img
                      src={msg.image}
                      alt="Captured stadium sign"
                      className="w-full h-auto object-cover max-h-[140px] rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Visual Translated Text Overlay */}
                    {msg.translationOverlay && (
                      <div className="absolute inset-1 bg-slate-950/80 backdrop-blur-xs flex flex-col justify-center items-center p-3 text-center text-white rounded-lg">
                        <span className="text-[8px] uppercase text-green-400 font-black tracking-widest block mb-1">TRANSLATED READOUT</span>
                        <p className="text-[11px] font-black text-white leading-tight">{msg.translationOverlay}</p>
                        <button
                          onClick={() => readAloudText(msg.translationOverlay || '')}
                          className="mt-2 bg-green-600 hover:bg-green-500 p-1 rounded-full text-white cursor-pointer"
                          title="Speak translation aloud"
                        >
                          <Volume2 size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`relative rounded-2xl p-3.5 leading-relaxed font-semibold shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-sm text-left'
                      : msg.sender === 'system'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-tl-none font-mono text-left'
                      : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-none text-left'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Speak button for assistant replies */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => readAloudText(msg.text)}
                        className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 hover:text-blue-600 transition-colors"
                        title="Read aloud text"
                      >
                        <Volume2 size={12} /> Read Aloud
                      </button>
                      {parseNavigationButtons(msg.text)}
                    </div>
                  )}
                </div>

                <div className="text-[9px] text-slate-400 font-black px-1 text-left">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading placeholder */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Bot size={13} />
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span className="text-left font-bold">Compass26 is studying the map and translating...</span>
            </div>
          </div>
        )}

        {imageTranslateLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0">
              <Languages size={13} />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-none p-3.5 text-xs text-green-800 flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-green-600" />
              <span className="text-left font-bold">OCR parsing and translation active...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="bg-white border-t border-slate-100 p-4 flex flex-col gap-2 relative z-10">
        {selectedImage && (
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-blue-600" />
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-800">Snapshot Ready</p>
                <p className="text-[8px] text-slate-400">Attached to send queue</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Real Camera Button / Simulator Trigger */}
          <button
            type="button"
            onClick={handleOpenCamera}
            className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-200 cursor-pointer"
            title="Scan ticket or sign with camera"
          >
            <Camera className="w-4 h-4" />
          </button>

          <input
            id="chat-input-text"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={selectedImage ? "Add comments..." : "Ask directions, nearest gate..."}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-semibold"
          />

          <button
            id="chat-send-button"
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-300 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Home Indicator mimicking a luxurious iOS screen bar */}
        <div className="w-28 h-1 bg-slate-200 rounded-full mx-auto mt-2"></div>
      </form>
    </div>
  );
};
