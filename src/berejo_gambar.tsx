import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Zap, Sun, Moon, Maximize, Palette, Download, RefreshCcw, 
  Loader2, Info, History, Trash2, Layers, Wind, Sliders, User, 
  UserMinus, Smile, Upload, X, ImageIcon, PlusCircle, Clock, 
  Instagram, Facebook, Youtube, ChevronDown, ChevronUp, 
  Aperture as ApertureIcon, Thermometer, Timer, Camera, 
  UserCheck, Map, Shirt, ImagePlus, AlertCircle, Layout, 
  Code, FlipHorizontal, Box, Monitor, Hourglass, Languages, 
  CheckCircle2, Wand2, Focus, Database, Type, ShieldAlert, 
  AlertTriangle, Eraser
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, query, 
  deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// =============================================================
// --- 1. ZONA AMAN: KONSTANTA GLOBAL (WAJIB PALING ATAS) ---
// =============================================================

const APP_VERSION = "v5.8.1-MASTER";
const apiKey = ""; // API Key ditangani secara dinamis oleh lingkungan runtime

const TikTokIconUI = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const CAMERA_ANGLES = [
  { id: 'eye-level', label: 'Eye Level Angle (Sejajar mata)', prompt: 'eye level angle perspective' },
  { id: 'low-angle', label: 'Low Angle (Bawah)', prompt: 'low angle perspective, looking up' },
  { id: 'high-angle', label: 'High Angle (Atas)', prompt: 'high angle perspective, looking down' },
  { id: 'birds-eye', label: 'Bird\'s Eye View (Sudut pandang burung)', prompt: 'top-down bird\'s eye view' },
  { id: 'frogs-eye', label: 'Frog\'s Eye View (Sudut sangat rendah)', prompt: 'frog\'s eye view, extreme low angle looking up' },
  { id: 'dutch-angle', label: 'Dutch Angle (Miring)', prompt: 'tilted camera dutch angle' },
];

const WHITE_BALANCES = [
  { id: 'default', label: 'Default (Ikut Prompt)', prompt: '' },
  { id: 'awb', label: 'AWB (3000-7000K)', prompt: 'AWB' },
  { id: 'daylight', label: 'Daylight (5200K)', prompt: 'daylight white balance 5200K' },
  { id: 'shade', label: 'Shade (7000K)', prompt: 'shade white balance 7000K' },
  { id: 'cloudy', label: 'Cloudy (6000K)', prompt: 'cloudy white balance 6000K' },
  { id: 'tungsten', label: 'Tungsten (3200K)', prompt: 'tungsten light 3200K' },
  { id: 'fluorescent', label: 'Fluorescent (4000K)', prompt: 'fluorescent light 4000K' },
];

const QUALITIES = [
  { id: 'high', label: 'High Precision (8K)', prompt: 'ultra-high definition, 8k resolution, extreme detail' },
  { id: 'medium', label: 'Standard High', prompt: 'high definition, detailed texture' },
  { id: 'standard', label: 'Balanced', prompt: 'standard resolution' },
];

const COLOR_SCHEMES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'monochrome', label: 'Monokromatik', prompt: 'monochromatic color scheme' },
  { id: 'analogous', label: 'Analog', prompt: 'analogous color harmony' },
  { id: 'complementary', label: 'Komplementer', prompt: 'complementary contrast' },
  { id: 'triadic', label: 'Triadik', prompt: 'triadic color harmony' },
  { id: 'tetradic', label: 'Tetradik', prompt: 'tetradic double-complementary color scheme' },
];

const SPECIAL_EFFECTS_ADV = [
  { id: 'default', label: 'Default', prompt: '' },
  { id: 'practical', label: 'Practical Effects', prompt: 'practical visual effects' },
  { id: 'cgi', label: 'CGI Enhancement', prompt: 'realistic CGI' },
  { id: 'glitches', label: 'Analog Glitches', prompt: 'analog glitch artifacts' },
  { id: 'light-paint', label: 'Light Painting', prompt: 'long exposure light painting' },
  { id: 'smoke', label: 'Volumetric Smoke', prompt: 'volumetric smoke diffusion' },
];

const STYLES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'realistic', label: 'Realistic', prompt: 'photorealistic highly detailed style' },
  { id: 'bohemian', label: 'Bohemian portrait', prompt: 'artistic bohemian portrait aesthetic' },
  { id: 'glass', label: 'Glass Distortion', prompt: 'refracted glass distortion effects' },
  { id: 'anime', label: 'Anime', prompt: 'modern anime illustration style' },
  { id: 'cartoon', label: 'Cartoon', prompt: 'playful cartoon illustration' },
  { id: 'minimalist', label: 'Minimalist', prompt: 'clean minimalist aesthetic' },
  { id: 'vintage', label: 'Vintage', prompt: 'retro vintage film look' },
  { id: 'futuristic', label: 'Futuristic', prompt: 'high-tech futuristic visual style' },
  { id: 'abstract', label: 'Abstract', prompt: 'abstract artistic expression' },
  { id: 'impressionist', label: 'Impressionist', prompt: 'impressionist oil painting style' },
  { id: 'surreal', label: 'Surreal', prompt: 'surreal dream-like visual composition' },
  { id: 'digital-art', label: 'Digital Art', prompt: 'modern digital art' },
  { id: 'oil-painting', label: 'Oil Painting', prompt: 'classic oil painting' },
  { id: 'watercolor', label: 'Watercolor', prompt: 'soft watercolor' },
  { id: 'sketch', label: 'Sketch', prompt: 'hand-drawn sketch' },
  { id: 'blueprint', label: 'Blueprint', prompt: 'technical blueprint' },
  { id: 'cyberpunk', label: 'Cyberpunk', prompt: 'cyberpunk aesthetic' },
];

const CHARACTER_STYLES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'realistic', label: 'Human Realistic', prompt: 'hyper-realistic human representation' },
  { id: 'clay', label: 'Clay', prompt: 'stop-motion claymation style character, textured clay' },
  { id: 'cartoon-2d', label: 'Cartoon (2D)', prompt: 'classic 2D hand-drawn cartoon style' },
  { id: 'wes-anderson', label: 'Wes Anderson style', prompt: 'Wes Anderson cinematic symmetrical style' },
  { id: 'lego', label: '3D LEGO style', prompt: 'LEGO minifigure style' },
  { id: 'pixar', label: 'Pixar-Style', prompt: 'Pixar 3D animation style' },
  { id: 'soft-cartoon', label: '3D Soft Cartoon-Style', prompt: 'soft 3D cartoon' },
  { id: 'ghibli', label: 'Studio Ghibli', prompt: 'Studio Ghibli style' },
  { id: 'anime', label: 'Anime', prompt: 'high-quality anime' },
  { id: 'chibi', label: 'Chibi 3D/2D style', prompt: 'cute chibi style' },
];

const ETHNICITIES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'indo-sumatra', label: 'Indonesia (Sumatra)', prompt: 'Indonesian Sumatra facial features' },
  { id: 'indo-sunda', label: 'Indonesia (Sunda)', prompt: 'Indonesian Sunda facial features' },
  { id: 'indo-jawa', label: 'Indonesia (Jawa)', prompt: 'Indonesian Jawa facial features' },
  { id: 'indo-medan', label: 'Indonesia (Medan)', prompt: 'Indonesian Batak Medan facial features' },
  { id: 'indo-pagaralam', label: 'Indonesia (Pagaralam)', prompt: 'Indonesian Pagaralam facial features' },
  { id: 'indo-papua', label: 'Indonesia (Papua)', prompt: 'Indonesian Papua facial features' },
  { id: 'cina', label: 'Wajah Cina', prompt: 'Chinese facial features' },
  { id: 'eropa', label: 'Wajah Eropa', prompt: 'European facial features' },
  { id: 'jepang', label: 'Wajah Jepang', prompt: 'Japanese facial features' },
  { id: 'korea', label: 'Wajah Korea', prompt: 'Korean facial features' },
  { id: 'amerika', label: 'Wajah Amerika', prompt: 'American facial features' },
];

const SKIN_TYPES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'fair', label: 'Fair (Putih)', prompt: 'fair skin tone' },
  { id: 'pale', label: 'Pale (Pucat)', prompt: 'pale skin tone' },
  { id: 'sawo-matang', label: 'Sawo Matang', prompt: 'tan Indonesian skin tone' },
  { id: 'tanned', label: 'Kecoklatan (Tanned)', prompt: 'tanned skin tone' },
  { id: 'dark', label: 'Gelap (Dark)', prompt: 'dark skin tone' },
  { id: 'ivory', label: 'Ivory (Gading)', prompt: 'ivory skin tone' },
];

const COSTUMES = [
  { id: 'prompt', label: 'Ikut Prompt', prompt: '' },
  { id: 'modern', label: 'Modern Stylish', prompt: 'modern stylish outfit' },
  { id: 'muslim', label: 'Muslim/Syar\'i', prompt: 'modest Muslim clothing' },
  { id: 'ihram', label: 'Pakaian Ihram', prompt: 'Islamic Ihram pilgrimage attire' },
  { id: 'tni', label: 'Pakaian TNI', prompt: 'Indonesian military (TNI) uniform' },
  { id: 'polri', label: 'Pakaian Polri', prompt: 'Indonesian police (Polri) uniform' },
  { id: 'asn-khaki', label: 'Pakaian ASN Khaki', prompt: 'Indonesian civil servant khaki uniform' },
  { id: 'asn-korpri', label: 'Pakaian ASN Korpri', prompt: 'Indonesian civil servant blue Batik Korpri uniform' },
  { id: 'kesultanan', label: 'Kostum Kesultanan', prompt: 'Traditional Indonesian Sultanate royal costume' },
  { id: 'majapahit', label: 'Kerajaan Majapahit/Sriwijaya', prompt: 'Ancient Majapahit or Sriwijaya Kingdom royal attire' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 (Square)', class: 'aspect-square', prompt: 'aspect ratio 1:1' },
  { id: '16:9', label: '16:9 (Landscape)', class: 'aspect-video', prompt: 'aspect ratio 16:9' },
  { id: '9:16', label: '9:16 (Portrait)', class: 'aspect-[9/16]', prompt: 'aspect ratio 9:16' },
  { id: '4:3', label: '4:3 (Standard)', class: 'aspect-[4/3]', prompt: 'aspect ratio 4:3' },
  { id: '21:9', label: '21:9 (Ultrawide)', class: 'aspect-[21/9]', prompt: 'aspect ratio 21:9' },
  { id: '2:3', label: '2:3 (Photo 4x6 cm)', class: 'aspect-[2/3]', prompt: 'aspect ratio 2:3' },
  { id: '3:4', label: '3:4 (Photo 3x4 cm)', class: 'aspect-[3/4]', prompt: 'aspect ratio 3:4' },
  { id: '3:2', label: '3:2 (Classic)', class: 'aspect-[3/2]', prompt: 'aspect ratio 3:2' },
];

const LANGUAGE_OPTIONS = [
  { id: 'id', label: 'Bahasa Indonesia', prompt: 'STRICT RULE: All text and labels in the image MUST be in Indonesian language.' },
  { id: 'en', label: 'Bahasa Inggris', prompt: 'STRICT RULE: All text and labels in the image MUST be in English language.' },
  { id: 'ar', label: 'Bahasa Arab', prompt: 'STRICT RULE: All text and labels in the image MUST be in Arabic script.' },
  { id: 'cn', label: 'Bahasa Mandarin', prompt: 'STRICT RULE: All text and labels in the image MUST be in Chinese script.' },
  { id: 'kr', label: 'Bahasa Korea', prompt: 'STRICT RULE: All text and labels in the image MUST be in Korean script.' },
  { id: 'jp', label: 'Bahasa Jepang', prompt: 'STRICT RULE: All text and labels in the image MUST be in Japanese script.' },
  { id: 'custom', label: 'Custom...', prompt: '' },
];

const NEGATIVE_OPTIONS = [
  "Teks tambahan", "Typho", "Syntax Error", "Watermark", "Resolusi rendah", "Kualitas Buruk", 
  "Buram", "Blur", "Cacat", "Asimetris", "Mata ekstra", "Anggota badan ekstra", 
  "Kulit tidak alami", "Anatomi buruk", "Kartun", "Animasi", "Tangan yang cacat", 
  "Pencahayaan berlebihan", "Fitur terdistorsi"
];

const SHUTTER_SPEEDS = ["1/8000s", "1/1000s", "1/250s", "1/60s", "1/8s", "1s", "10s", "30s"];
const APERTURES = ["f/1.4", "f/2.8", "f/4.0", "f/5.6", "f/8.0", "f/11", "f/16", "f/22"];

const REALISM_OPTIONS = [
  { id: 'draft', label: 'Draft', prompt: 'raw draft texture' },
  { id: 'neutral', label: 'Neutral', prompt: 'balanced reality' },
  { id: 'photo', label: 'Photo', prompt: 'hyper-realistic photographic texture' },
];

const EFFECT_LIST = [
  "bokeh", "volumetric_fog", "particles", "light_leak", "time lapse", "motion blur", "vintage filter", 
  "high contrast", "HDR", "smoke effects", "wind effects", "dust effects", "fisheye", "macro", 
  "split toning", "infrared", "night vision", "datamoshing", "posterize", "invert", "depth_of_field", 
  "rain", "rack focus", "film_grain", "reverse motion", "chromatic aberration", "sepia tone", 
  "color grading", "bloom effect", "fire effects", "fog effects", "light rays", "wide angle", 
  "tilt shift", "color pop", "thermal", "holographic", "pixel sorting", "solarize", "threshold", 
  "lens flare", "snow", "vertigo_effect", "slow motion", "freeze frame", "vignette", "black and white", 
  "cinematic look", "god rays", "water effects", "mist effects", "lens distortion", "telephoto", 
  "cross processing", "selective color", "oxray", "glitch", "edge detection", "negative"
];

const SOCIAL_LINKS = [
  { id: 'tt', Icon: TikTokIconUI, url: 'https://www.tiktok.com/@cekguarman', color: 'hover:text-amber-400' },
  { id: 'ig', Icon: Instagram, url: 'https://www.instagram.com/cekguarman', color: 'hover:text-amber-500' },
  { id: 'yt', Icon: Youtube, url: 'https://www.youtube.com/@cekguarman', color: 'hover:text-red-500' },
  { id: 'fb', Icon: Facebook, url: 'https://www.facebook.com/cekguarman', color: 'hover:text-blue-500' },
];

// --- 2. FIREBASE SYSTEM INITIALIZATION ---
let firebaseConfig = {};
try {
  firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "mock-api-key",
    authDomain: "mock.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock.appspot.com",
    messagingSenderId: "12345678",
    appId: "1:123:web:123"
  };
} catch(e) {
  console.warn("Using fallback Firebase configuration.");
}

const app_init = initializeApp(firebaseConfig);
const auth_init = getAuth(app_init);
const db_init = getFirestore(app_init);
const appId_final = typeof __app_id !== 'undefined' ? __app_id : 'berejo-gambar-pro';

// =============================================================
// --- 3. MAIN REACT APP COMPONENT ---
// =============================================================

const App = () => {
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('image');

  // --- CONTROLLER FORM STATE ---
  const [prompt, setPrompt] = useState('');
  const [isTranslateOn, setIsTranslateOn] = useState(true);
  const [isNegativeOn, setIsNegativeOn] = useState(true);
  const [selectedNegatives, setSelectedNegatives] = useState(NEGATIVE_OPTIONS);
  
  const [style, setStyle] = useState(STYLES[0].id);
  const [ratio, setRatio] = useState(ASPECT_RATIOS[0].id);
  const [quality, setQuality] = useState(QUALITIES[0].id);
  const [realismIdx, setRealismIdx] = useState(1);
  const [cfgScale, setCfgScale] = useState(0.5);
  const [outputLanguage, setOutputLanguage] = useState('id'); // Default Bahasa Indonesia
  const [customLanguageText, setCustomLanguageText] = useState('');

  const [isAdvancedActive, setIsAdvancedActive] = useState(false);
  const [whiteBalance, setWhiteBalance] = useState(WHITE_BALANCES[0].id);
  const [shutterIdx, setShutterIdx] = useState(3);
  const [apertureIdx, setApertureIdx] = useState(3);
  const [camAngle, setCamAngle] = useState(CAMERA_ANGLES[0].id);
  const [specialEffectAdv, setSpecialEffectAdv] = useState(SPECIAL_EFFECTS_ADV[0].id);
  const [colorScheme, setColorScheme] = useState(COLOR_SCHEMES[0].id);
  const [selectedEffects, setSelectedEffects] = useState([]);

  // Subjek Manusia & Referensi Gambar
  const [hasHuman, setHasHuman] = useState(false);
  const [characterStyle, setCharacterStyle] = useState(CHARACTER_STYLES[0].id);
  const [costume, setCostume] = useState(COSTUMES[0].id);
  const [skinType, setSkinType] = useState(SKIN_TYPES[0].id);
  const [ethnicity, setEthnicity] = useState(ETHNICITIES[0].id);
  const [isFaceIdentical, setIsFaceIdentical] = useState(false);

  const [referenceImages, setReferenceImages] = useState([]);
  const [isFlipped, setIsFlipped] = useState([false, false]);
  const [maintainBackground, setMaintainBackground] = useState(false);

  // Hasil & Jejak Cloud
  const [generatedImages, setGeneratedImages] = useState([]);
  const [currentMetadata, setCurrentMetadata] = useState(null);
  const [history, setHistory] = useState([]);

  // --- FIREBASE SECURITY HOOKS ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth_init, __initial_auth_token);
        } else {
          await signInAnonymously(auth_init);
        }
      } catch (err) { console.error("Firebase auth bypass active"); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth_init, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const historyRef = collection(db_init, 'artifacts', appId_final, 'users', user.uid, 'history');
    const q = query(historyRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let interval;
    if (isGenerating) {
      setGenProgress(0);
      interval = setInterval(() => {
        setGenProgress(prev => (prev < 98 ? prev + Math.random() * 4 : prev));
      }, 450);
    } else {
      setGenProgress(0);
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isGenerating]);

  // --- UI INTERACTION HANDLERS ---
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const toggleEffect = (eff) => setSelectedEffects(prev => prev.includes(eff) ? prev.filter(e => e !== eff) : [...prev, eff]);
  const toggleNegative = (neg) => setSelectedNegatives(prev => prev.includes(neg) ? prev.filter(n => n !== neg) : [...prev, neg]);
  const toggleFlip = (idx) => { const n = [...isFlipped]; n[idx] = !n[idx]; setIsFlipped(n); };
  const removeRef = (idx) => { setReferenceImages(p => p.filter((_, i) => i !== idx)); const n = [...isFlipped]; n[idx] = false; setIsFlipped(n); };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (referenceImages.length + files.length > 2) return;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1];
        setReferenceImages(prev => [...prev, base64].slice(0, 2));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const translateText = async (text) => {
      try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: `Translate image prompt to technical descriptive English: "${text}". Result string only.` }] }] })
          });
          const data = await response.json();
          return data.candidates?.[0]?.content?.parts?.[0]?.text || text;
      } catch (err) { return text; }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;
    setIsGenerating(true);
    setError(null);
    setGenProgress(5);
    setViewMode('image');

    let englishTranslation = prompt;
    if (isTranslateOn) englishTranslation = await translateText(prompt);

    const selStyles = STYLES.find(s => s.id === style)?.prompt || "";
    const selQual = QUALITIES.find(q => q.id === quality)?.prompt || "";
    const selReal = REALISM_OPTIONS[realismIdx].prompt;
    const selRatioObj = ASPECT_RATIOS.find(r => r.id === ratio);
    const selEff = selectedEffects.map(e => e.replace('_', ' ') + " effect").join(', ');
    
    const selLang = outputLanguage === 'custom' 
        ? `STRICT RULE: All text and labels in the image MUST be in language: "${customLanguageText}".`
        : LANGUAGE_OPTIONS.find(l => l.id === outputLanguage)?.prompt 
          ? `STRICT RULE: ${LANGUAGE_OPTIONS.find(l => l.id === outputLanguage).prompt}`
          : "";

    const finalNegatives = isNegativeOn ? selectedNegatives.join(', ') : "";
    const negativeP = finalNegatives ? `STRICT NEGATIVE PROMPT (DO NOT RENDER): ${finalNegatives}, parameter text, cfg scales, geometry labels.` : "";

    let subjekStr = hasHuman 
      ? `Subject Persona: ${CHARACTER_STYLES.find(s => s.id === characterStyle).prompt}. Ethnicity: ${ETHNICITIES.find(e => e.id === ethnicity).prompt}. Costume: ${COSTUMES.find(c => c.id === costume).prompt}. Skin: ${SKIN_TYPES.find(s => s.id === skinType).prompt}.` 
      : "Focus on environments or inanimate objects.";

    let overridePrompt = "";
    if (referenceImages.length > 0) {
        if (hasHuman && isFaceIdentical) overridePrompt += " SYSTEM: Reference 1 is master face key. Replicate identically.";
        if (maintainBackground) overridePrompt += " SYSTEM: Lock architectural/environmental details exactly as references.";
        referenceImages.forEach((_, idx) => {
            if (isFlipped[idx]) overridePrompt += ` ALERT: Ref ${idx+1} is horizontal mirrored. Recognition awareness.`;
        });
        if (referenceImages.length === 2) {
            overridePrompt += " INTEGRATION: Ref 1 (Primary). Ref 2 (Context). Synthesize into ONE single image result.";
        }
    }

    let advancedPrompt = "";
    if (isAdvancedActive) {
      advancedPrompt = `Camera: ${CAMERA_ANGLES.find(a => a.id === camAngle).prompt}, Shutter: ${SHUTTER_SPEEDS[shutterIdx]}, Aperture: ${APERTURES[apertureIdx]}. Lighting: ${WHITE_BALANCES.find(w => w.id === whiteBalance).prompt}. FX: ${SPECIAL_EFFECTS_ADV.find(f => f.id === specialEffectAdv).prompt}. ${selEff ? 'Effects: ' + selEff : ''}`;
    }

    const fullPrompt = `STRICT VISUAL CLEANLINESS PROTOCOL: DO NOT RENDER any technical text, parameter labels, cfg values, or metadata within the image. ${subjekStr} Render in ${selQual}. Use ${selReal}. Match ${selRatioObj.prompt}. ${selLang}. ${negativeP}. ${overridePrompt} ${advancedPrompt} Visual narrative instruction: ${englishTranslation}. Style Guide: ${selStyles}. CFG: ${cfgScale}. GEOMETRY: strict natural proportionality.`;

    try {
      let newImages = [];
      let modelUsed = referenceImages.length > 0 ? "Gemini 2.5 Flash Vision" : "Imagen 4.0";
      
      if (referenceImages.length > 0) {
        const parts = referenceImages.map(img => ({ inlineData: { mimeType: "image/png", data: img } }));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [ { text: `Synthesis Instruction: High-fidelity visual blending. Combine references into ONE result based on: ${fullPrompt}` }, ...parts] }],
                generationConfig: { responseModalities: ['IMAGE'] }
            })
        });
        const d = await response.json();
        const b64 = d.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (b64) newImages = [`data:image/png;base64,${b64}`];
      } else {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: { prompt: fullPrompt }, parameters: { sampleCount: 1 } })
        });
        const d = await response.json();
        newImages = d.predictions.map(p => `data:image/png;base64,${p.bytesBase64Encoded}`);
      }

      if (newImages.length > 0) {
        setGeneratedImages(newImages);
        setGenProgress(100);
        const cfg = { style, camAngle, ratio, hasHuman, ethnicity, skinType, costume, characterStyle, cfgScale, realismIdx, isAdvancedActive, whiteBalance, specialEffectAdv, shutterIdx, apertureIdx, isFaceIdentical, maintainBackground, quality, colorScheme, selectedEffects, outputLanguage, customLanguageText, isNegativeOn, selectedNegatives };
        const metaData = { prompt: englishTranslation, parameters: cfg, model: modelUsed, timestamp: new Date().toISOString(), version: APP_VERSION };
        setCurrentMetadata(metaData);
        if (user) await addDoc(collection(db_init, 'artifacts', appId_final, 'users', user.uid, 'history'), { prompt: String(prompt), config: cfg, createdAt: serverTimestamp(), metadata_json: JSON.stringify(metaData) });
      } else { setError("Output gagal dihasilkan."); }
    } catch (err) { setError("Sistem gagal memproses visual."); } finally { setIsGenerating(false); }
  };

  const handleDownload = async (base64) => {
    try {
      const res = await fetch(base64);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `berejo-vision-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) { window.open(base64, '_blank'); }
  };

  const resetCanvas = () => { setPrompt(''); setGeneratedImages([]); setCurrentMetadata(null); setError(null); };

  const loadProject = (item) => {
    setPrompt(String(item.prompt || ''));
    if (item.config) {
      setStyle(item.config.style || STYLES[0].id);
      setRatio(item.config.ratio || ASPECT_RATIOS[0].id);
      setCfgScale(item.config.cfgScale || 0.5);
      setQuality(item.config.quality || QUALITIES[0].id);
      setRealismIdx(item.config.realismIdx ?? 1);
      setHasHuman(item.config.hasHuman || false);
      setEthnicity(item.config.ethnicity || ETHNICITIES[0].id);
      setSkinType(item.config.skinType || SKIN_TYPES[0].id);
      setCostume(item.config.costume || COSTUMES[0].id);
      setCharacterStyle(item.config.characterStyle || CHARACTER_STYLES[0].id);
      setIsAdvancedActive(!!item.config.isAdvancedActive);
      setSelectedEffects(item.config.selectedEffects || []);
      setOutputLanguage(item.config.outputLanguage || 'id');
      setIsNegativeOn(item.config.isNegativeOn ?? true);
      setSelectedNegatives(item.config.selectedNegatives || NEGATIVE_OPTIONS);
    }
    setGeneratedImages(item.results || []);
    setCurrentMetadata(item.metadata_json ? JSON.parse(item.metadata_json) : null);
    setViewMode('image');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = async (e, id) => { e.stopPropagation(); if (user) await deleteDoc(doc(db_init, 'artifacts', appId_final, 'users', user.uid, 'history', id)); };

  const themeClasses = theme === 'dark' 
    ? { 
        bg: 'bg-[#0a0a0c] text-zinc-100', 
        header: 'bg-[#0f0f12]/95 border-amber-900/20 shadow-2xl', 
        card: 'bg-[#121218]/80 border-amber-900/10 shadow-2xl backdrop-blur-3xl', 
        input: 'bg-[#070709] border-zinc-800 text-zinc-100', 
        historyItem: 'bg-[#16161e] border-zinc-800/40 hover:border-amber-500/30', 
        activeBtn: 'bg-amber-600 text-white border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]', 
        inactiveBtn: 'bg-[#1c1c24] border-zinc-800 text-zinc-400 hover:text-zinc-100', 
        titleText: 'text-zinc-100 font-normal uppercase tracking-widest', // Putih terang (Normal)
        creatorName: 'text-amber-500',
        versionText: 'text-white font-mono opacity-80',
        specialInput: 'bg-black border-zinc-800 text-white',
        advancedLabel: 'text-white/70 font-black'
      }
    : { 
        bg: 'bg-zinc-50 text-zinc-900', 
        header: 'bg-white border-zinc-200 shadow-xl', 
        card: 'bg-white border-zinc-200 shadow-2xl', 
        input: 'bg-zinc-950 text-white border-zinc-950 font-bold shadow-inner', 
        historyItem: 'bg-white border-zinc-200 hover:border-amber-600 shadow-sm', 
        activeBtn: 'bg-amber-600 text-white border-amber-700 shadow-xl', 
        inactiveBtn: 'bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-900 font-bold', 
        titleText: 'text-zinc-950 font-black uppercase tracking-widest', // Hitam pekat
        creatorName: 'text-zinc-900',
        versionText: 'text-zinc-900 font-mono font-black',
        specialInput: 'bg-black border-zinc-800 text-white',
        advancedLabel: 'text-zinc-950 font-black' // Label panel teknik hitam mode terang
      };

  const currentRatioClass = ASPECT_RATIOS.find(r => r.id === ratio)?.class || 'aspect-square';

  return (
    <div className={`min-h-screen font-sans transition-all duration-300 selection:bg-amber-500/30 selection:text-amber-100 ${themeClasses.bg}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-4 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h1 className="text-xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent uppercase whitespace-nowrap">
              Berejo Gambar <span className={`text-[9px] md:text-sm ml-2 ${themeClasses.versionText}`}>{APP_VERSION}</span>
            </h1>
            <div className="hidden sm:flex flex-col border-l border-white/10 pl-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-white" />
                <p className={`text-sm md:text-base font-black truncate ${themeClasses.creatorName}`}>Armansyah</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             <button onClick={resetCanvas} className={`p-2.5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-amber-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`} title="Reset Canvas"><PlusCircle className="w-5 h-5 md:w-6 md:h-6" /></button>
             <button onClick={toggleTheme} className={`p-2.5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-amber-500' : 'bg-zinc-100 border-zinc-200 text-zinc-900'}`}>{theme === 'dark' ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}</button>
          </div>
        </div>
      </header>

      {}
      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Row 1: References & Subjek */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div className={`border rounded-[2.5rem] p-6 md:p-8 transition-all duration-300 ${themeClasses.card}`}>
                <p className={`text-xs mb-6 flex items-center gap-2 ${themeClasses.titleText}`}>
                    <ImageIcon className="w-4 h-4 text-amber-500" /> Gambar Rujukan ({referenceImages.length}/2)
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {referenceImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                            <div className={`aspect-square rounded-[1.8rem] overflow-hidden border-2 transition-transform duration-500 ${theme === 'dark' ? 'border-amber-500/20' : 'border-zinc-200 shadow-lg'} ${isFlipped[idx] ? 'scale-x-[-1]' : ''}`}>
                                <img src={`data:image/png;base64,${img}`} className="w-full h-full object-cover" alt="Ref" />
                            </div>
                            <div className="absolute -top-3 -right-3 flex gap-1.5 z-10">
                                <button onClick={() => toggleFlip(idx)} title="Flip Horizontal" className="bg-amber-600 text-white p-2.5 rounded-full shadow-xl"><FlipHorizontal className="w-4 h-4" /></button>
                                <button onClick={() => removeRef(idx)} title="Hapus" className="bg-red-600 text-white p-2.5 rounded-full shadow-xl"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {referenceImages.length < 2 && (
                        <label className={`aspect-square border-4 border-dashed rounded-[1.8rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-amber-500 hover:bg-amber-500/5 ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-300 bg-zinc-100 text-zinc-400'}`}>
                            <ImagePlus className={`w-8 h-8 ${theme === 'dark' ? 'opacity-30 text-amber-500' : 'text-zinc-400'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-center px-4">Upload Ref {referenceImages.length + 1}</span>
                            <input type="file" multiple onChange={handleFileUpload} accept="image/*" className="hidden" />
                        </label>
                    )}
                </div>
                {referenceImages.length > 0 && (
                    <label className={`flex items-center justify-between p-4 rounded-2xl border border-dashed cursor-pointer transition-all ${theme === 'dark' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-100 border-zinc-200 shadow-sm'}`}>
                        <div className="flex flex-col flex-1 pr-4">
                            <div className="flex items-center gap-3"><Map className="w-4 h-4 text-amber-400" /><span className={`text-[11px] md:text-xs font-black uppercase ${theme === 'dark' ? 'text-amber-400' : 'text-zinc-900'}`}>Kunci Latar</span></div>
                            <span className="text-[8px] font-bold opacity-60 mt-1 leading-tight uppercase tracking-tighter">Fix Environment Structure</span>
                        </div>
                        <input type="checkbox" checked={maintainBackground} onChange={(e) => setMaintainBackground(e.target.checked)} className="w-5 h-5 rounded-lg accent-amber-500 shadow-xl" />
                    </label>
                )}
            </div>

            <div className={`border rounded-[2.5rem] p-6 md:p-8 transition-all duration-300 ${themeClasses.card}`}>
                <p className={`text-xs mb-6 uppercase tracking-widest ${themeClasses.titleText}`}>KONFIGURASI SUBJEK</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setHasHuman(true)} className={`py-4 px-2 rounded-2xl text-[10px] font-black border flex items-center justify-center gap-2 transition-all ${hasHuman ? themeClasses.activeBtn : themeClasses.inactiveBtn}`}><User className="w-3.5 h-3.5" /> ADA KARAKTER</button>
                    <button onClick={() => setHasHuman(false)} className={`py-4 px-2 rounded-2xl text-[10px] font-black border flex items-center justify-center gap-2 transition-all ${!hasHuman ? themeClasses.activeBtn : themeClasses.inactiveBtn}`}><UserMinus className="w-3.5 h-3.5" /> TANPA KARAKTER</button>
                </div>
                {hasHuman && (
                  <div className="space-y-4 animate-in">
                    <label className={`flex items-center justify-between p-4 rounded-2xl border border-dashed cursor-pointer transition-all bg-[#121218]`}>
                        <div className="flex items-center gap-3"><UserCheck className="w-4 h-4 text-yellow-400" /><span className="text-[11px] md:text-xs font-black uppercase text-white">Wajah Identik?</span></div>
                        <input type="checkbox" checked={isFaceIdentical} onChange={(e) => setIsFaceIdentical(e.target.checked)} className="w-5 h-5 rounded-lg accent-amber-600 shadow-xl" />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><p className={`text-[9px] font-black mb-1 opacity-70 uppercase ${themeClasses.titleText}`}>Etnis Wajah</p><select value={ethnicity} onChange={(e) => setEthnicity(e.target.value)} className={`w-full border rounded-xl p-2.5 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{ETHNICITIES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                      <div><p className={`text-[9px] font-black mb-1 opacity-70 uppercase ${themeClasses.titleText}`}>Pilih Kostum</p><select value={costume} onChange={(e) => setCostume(e.target.value)} className={`w-full border rounded-xl p-2.5 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{COSTUMES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                      <div><p className={`text-[9px] font-black mb-1 opacity-70 uppercase ${themeClasses.titleText}`}>Bentuk Visual</p><select value={characterStyle} onChange={(e) => setCharacterStyle(e.target.value)} className={`w-full border rounded-xl p-2.5 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{CHARACTER_STYLES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                      <div><p className={`text-[9px] font-black mb-1 opacity-70 uppercase ${themeClasses.titleText}`}>Jenis Kulit</p><select value={skinType} onChange={(e) => setSkinType(e.target.value)} className={`w-full border rounded-xl p-2.5 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{SKIN_TYPES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                    </div>
                  </div>
                )}
            </div>
        </div>

        {/* PARAMATER VISUAL (TENGAH) */}
        <div className={`border rounded-[3rem] p-8 md:p-10 transition-all duration-300 ${themeClasses.card}`}>
            <h3 className={`text-xs font-black uppercase tracking-[0.4em] mb-8 text-center ${themeClasses.titleText}`}>Parameter Visual Utama</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="flex flex-col"><p className={`text-[10px] font-black mb-2 opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>Gaya Visual</p><select value={style} onChange={(e) => setStyle(e.target.value)} className={`w-full border rounded-xl p-4 text-xs font-black outline-none ${themeClasses.specialInput}`}>{STYLES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                <div className="flex flex-col"><p className={`text-[10px] font-black mb-2 opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>Ratio Gambar</p><select value={ratio} onChange={(e) => setRatio(e.target.value)} className={`w-full border rounded-xl p-4 text-xs font-black outline-none ${themeClasses.specialInput}`}>{ASPECT_RATIOS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                <div className="flex flex-col"><p className={`text-[10px] font-black mb-2 opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>Kualitas Render</p><select value={quality} onChange={(e) => setQuality(e.target.value)} className={`w-full border rounded-xl p-4 text-xs font-black outline-none ${themeClasses.specialInput}`}>{QUALITIES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                
                <div className="flex flex-col lg:col-span-3">
                    <p className={`text-[10px] font-black mb-2 opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>Bahasa Hasil</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)} className={`flex-1 border rounded-xl p-4 text-xs font-black outline-none ${themeClasses.specialInput}`}>
                            {LANGUAGE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                        {outputLanguage === 'custom' && (
                            <input type="text" value={customLanguageText} onChange={(e) => setCustomLanguageText(e.target.value)} placeholder="Tulis bahasa hasil..." className={`flex-1 border rounded-xl p-4 text-xs font-black outline-none ${themeClasses.specialInput}`} />
                        )}
                    </div>
                </div>
            </div>
            <div className="space-y-8">
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <p className={`text-[10px] font-black opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>Tingkat Realisme</p>
                        <span className="text-[10px] font-mono text-amber-500 font-black">{REALISM_OPTIONS[realismIdx].label}</span>
                    </div>
                    <input type="range" min="0" max="2" step="1" value={realismIdx} onChange={(e) => setRealismIdx(parseInt(e.target.value))} className="w-full h-2.5 bg-zinc-800 rounded-full appearance-none accent-amber-500" />
                </div>
                <div className="space-y-3" title="Atur seberapa patuh AI terhadap instruksi teks.">
                    <div className="flex justify-between items-center px-1">
                        <p className={`text-[10px] font-black opacity-60 uppercase tracking-widest ${themeClasses.titleText}`}>CFG Scale (Kepatuhan Teks)</p>
                        <span className="text-[10px] font-mono text-amber-500 font-black">{cfgScale === 0 ? 'Flexible' : cfgScale === 0.5 ? 'Balanced' : 'Strict'}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.5" value={cfgScale} onChange={(e) => setCfgScale(parseFloat(e.target.value))} className="w-full h-2.5 bg-zinc-800 rounded-full appearance-none accent-amber-500" />
                </div>
            </div>
        </div>

        {/* SECTION: PENGATURAN LANJUT */}
        {}
        <div className={`border rounded-[3.5rem] p-8 md:p-12 transition-all duration-300 ${themeClasses.card}`}>
            <button onClick={() => setIsAdvancedActive(!isAdvancedActive)} className={`w-full p-6 rounded-3xl border flex items-center justify-between transition-all ${isAdvancedActive ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 shadow-xl' : themeClasses.inactiveBtn}`}>
                <div className="flex items-center gap-4"><Sliders className="w-6 h-6" /><span className="text-xs md:text-sm font-black uppercase tracking-[0.4em]">Pengaturan Lanjut Kamera & Efek</span></div>
                {isAdvancedActive ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
            </button>
            
            {isAdvancedActive && (
                <div className="mt-10 space-y-10 animate-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div><p className={`text-[10px] font-black mb-2 uppercase tracking-widest ${themeClasses.advancedLabel}`}>White Balance</p><select value={whiteBalance} onChange={(e) => setWhiteBalance(e.target.value)} className={`w-full border rounded-xl p-3 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{WHITE_BALANCES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                        <div><p className={`text-[10px] font-black mb-1.5 uppercase tracking-widest ${themeClasses.advancedLabel}`}>Shutter Speed: {SHUTTER_SPEEDS[shutterIdx]}</p><input type="range" min="0" max={SHUTTER_SPEEDS.length - 1} step="1" value={shutterIdx} onChange={(e) => setShutterIdx(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-cyan-500" /></div>
                        <div><p className={`text-[10px] font-black mb-1.5 uppercase tracking-widest ${themeClasses.advancedLabel}`}>Aperture: {APERTURES[apertureIdx]}</p><input type="range" min="0" max={APERTURES.length - 1} step="1" value={apertureIdx} onChange={(e) => setApertureIdx(parseInt(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-full appearance-none accent-cyan-500" /></div>
                        <div><p className={`text-[10px] font-black mb-2 uppercase tracking-widest ${themeClasses.advancedLabel}`}>Arah Kamera</p><select value={camAngle} onChange={(e) => setCamAngle(e.target.value)} className={`w-full border rounded-xl p-3 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{CAMERA_ANGLES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                        <div><p className={`text-[10px] font-black mb-2 uppercase tracking-widest ${themeClasses.advancedLabel}`}>Special FX</p><select value={specialEffectAdv} onChange={(e) => setSpecialEffectAdv(e.target.value)} className={`w-full border rounded-xl p-3 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{SPECIAL_EFFECTS_ADV.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                        <div><p className={`text-[10px] font-black mb-2 uppercase tracking-widest ${themeClasses.advancedLabel}`}>Skema Warna</p><select value={colorScheme} onChange={(e) => setColorScheme(e.target.value)} className={`w-full border rounded-xl p-3 text-[11px] font-black outline-none ${themeClasses.specialInput}`}>{COLOR_SCHEMES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select></div>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                        <p className={`text-[11px] font-black mb-5 uppercase tracking-[0.2em] flex items-center gap-2 ${themeClasses.advancedLabel}`}><Wand2 className="w-4 h-4 text-amber-500" /> Barisan Efek Visual</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto pr-3 custom-scrollbar p-5 bg-black rounded-[2rem] border border-zinc-800 shadow-inner shadow-black">
                            {EFFECT_LIST.map(eff => (
                                <label key={eff} className="flex items-center gap-2.5 cursor-pointer group transition-all hover:translate-x-1">
                                    <input type="checkbox" checked={selectedEffects.includes(eff)} onChange={() => toggleEffect(eff)} className="w-4 h-4 rounded border-zinc-800 accent-amber-500 shadow-xl" />
                                    <span className="text-[9px] font-normal uppercase text-zinc-100 truncate">{eff.replace('_', ' ')}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* SECTION: NEGATIVE PROMPT (JANGAN BUAT) */}
        <div className={`border rounded-[3.5rem] p-8 md:p-12 transition-all duration-300 ${themeClasses.card}`}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Eraser className="w-6 h-6 text-red-500" />
                    <h3 className={`text-xs md:text-sm font-black uppercase tracking-[0.4em] ${themeClasses.titleText}`}>Negative Prompt (Jangan Buat) :</h3>
                </div>
                <button onClick={() => setIsNegativeOn(!isNegativeOn)} className={`flex items-center gap-3 px-6 py-2 rounded-xl text-[10px] font-black transition-all border ${isNegativeOn ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-900/20' : 'bg-transparent border-white/10 opacity-40'}`}>
                    {isNegativeOn ? <ShieldAlert className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    {isNegativeOn ? 'AKTIF' : 'NONAKTIF'}
                </button>
            </div>
            
            {isNegativeOn && (
                <div className="animate-in">
                    <p className="text-[10px] mb-5 opacity-60 uppercase tracking-[0.2em] flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> Filter Kualitas & Anatomi</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto pr-3 custom-scrollbar p-5 bg-black rounded-[2rem] border border-zinc-800 shadow-inner shadow-black">
                        {NEGATIVE_OPTIONS.map(neg => (
                            <label key={neg} className="flex items-center gap-2.5 cursor-pointer group transition-all hover:translate-x-1">
                                <input type="checkbox" checked={selectedNegatives.includes(neg)} onChange={() => toggleNegative(neg)} className="w-4 h-4 rounded border-zinc-800 accent-red-500 shadow-xl" />
                                <span className="text-[9px] font-normal uppercase text-zinc-100 truncate">{neg}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Narrative Box */}
        <div className={`border rounded-[3.5rem] p-8 md:p-14 transition-all duration-300 ${themeClasses.card}`}>
            <div className="flex flex-col lg:flex-row gap-10 items-end">
                <div className="flex-1 w-full space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <p className={`text-xs uppercase tracking-[0.2em] ${themeClasses.titleText}`}>NARASI VISUAL UTAMA</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsTranslateOn(!isTranslateOn)} title="Translate prompt ke Inggris" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${isTranslateOn ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-transparent border-white/10 opacity-40'}`}><Languages className="w-3.5 h-3.5" /> {isTranslateOn ? 'TRANSLATE ON' : 'TRANSLATE OFF'}</button>
                        </div>
                    </div>
                    <textarea className={`w-full border rounded-[2.5rem] p-8 text-base md:text-xl font-medium outline-none transition-all h-32 md:h-48 resize-none placeholder:text-zinc-600 ${themeClasses.input} focus:ring-8 focus:ring-amber-500/10 shadow-inner shadow-black/40`} placeholder="Tulis prompt anda disini..." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                </div>
                <button 
                  disabled={!prompt.trim() || isGenerating || !user} 
                  onClick={handleGenerate} 
                  className={`w-full lg:w-80 py-10 md:py-14 rounded-[3.5rem] font-black text-xl tracking-[0.2em] flex items-center justify-center gap-5 transition-all transform active:scale-95 shadow-2xl ${(!prompt.trim() || isGenerating) ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-gradient-to-br from-amber-400 via-amber-600 to-orange-700 text-white hover:brightness-110'}`}>
                {isGenerating ? <Hourglass className="w-8 h-8 animate-spin-slow text-amber-200" /> : <Zap className="w-8 h-8" />}
                {isGenerating ? `${Math.floor(genProgress)}%` : 'BUAT GAMBAR'}
                </button>
            </div>
            {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3"><AlertCircle className="w-5 h-5" /> {error}</div>}
        </div>

        {/* Results Area */}
        {}
        <div className="lg:col-span-12">
            <div className="flex flex-col items-center space-y-12">
                {isGenerating ? (
                <div className="w-full max-w-xl aspect-video rounded-[3.5rem] border border-white/5 bg-black flex flex-col items-center justify-center gap-8 animate-pulse shadow-2xl">
                    <Hourglass className="w-20 h-20 text-amber-500 animate-spin-slow" />
                    <span className="text-lg tracking-[0.8em] text-white font-black uppercase text-center pl-[0.8em]">MOHON TUNGGU... {Math.floor(genProgress)}%</span>
                </div>
                ) : (generatedImages.length > 0) ? (
                <div className="w-full max-w-xl space-y-10 flex flex-col items-center animate-in duration-1000">
                    <div className="flex gap-3 p-2 bg-black/30 rounded-[2rem] border border-white/10 shadow-2xl backdrop-blur-3xl">
                        <button onClick={() => setViewMode('image')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'image' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl' : 'opacity-40'}`}>VISUAL HASIL</button>
                        <button onClick={() => setViewMode('json')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${viewMode === 'json' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-xl' : 'opacity-40'}`}>DATA JSON</button>
                    </div>
                    <div className={`relative w-full rounded-[3.5rem] overflow-hidden border shadow-[0_40px_120px_rgba(0,0,0,0.5)] transition-all duration-1000 ${currentRatioClass} ${theme === 'dark' ? 'border-zinc-800 bg-[#070709]' : 'border-zinc-300 bg-white'}`}>
                        {viewMode === 'image' ? (
                            <img src={generatedImages[0]} alt="Art" className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full p-8 md:p-10 overflow-auto font-mono text-amber-400 bg-black/95 scrollbar-thin text-[10px]">
                                <pre>{currentMetadata ? JSON.stringify(currentMetadata, null, 2) : "// Loading metadata..."}</pre>
                            </div>
                        )}
                        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 text-[8px] font-black text-white/90 uppercase tracking-widest shadow-2xl">Hasil Berejo Gambar</div>
                    </div>
                    <button onClick={() => handleDownload(generatedImages[0])} className="w-full md:w-auto px-12 py-5 rounded-[2.5rem] font-black text-base md:text-lg tracking-[0.4em] flex items-center justify-center gap-6 transition-all border-4 bg-white border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white shadow-2xl transform hover:-translate-y-4">
                        <Download className="w-6 h-6 md:w-8 md:h-8" /> UNDUH SEKARANG
                    </button>
                </div>
                ) : (
                <div className={`w-full max-w-xl aspect-video border-8 border-dashed rounded-[4rem] flex flex-col items-center justify-center p-12 transition-all ${theme === 'dark' ? 'border-zinc-800 bg-zinc-900/10' : 'border-zinc-200 bg-zinc-50 shadow-inner'}`}>
                    <Database className="w-12 h-12 text-amber-600 opacity-20 mb-8" />
                    <h3 className={`text-xl md:text-3xl font-black tracking-tighter opacity-40 uppercase text-center mb-4 ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Hasil Gambar</h3>
                    <p className={`text-[10px] uppercase font-bold opacity-30 tracking-[0.4em] text-center font-mono uppercase ${theme === 'light' ? 'text-zinc-950' : 'text-white'}`}>Hasil AI bisa keliru, lakukan pengulangan instruksi untuk melatihnya juga</p>
                </div>
                )}
            </div>

            {/* Cloud Ledger */}
            {}
            <div className={`mt-32 border rounded-[3rem] md:rounded-[4.5rem] p-6 md:p-10 transition-all ${themeClasses.card}`}>
                <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.6em] mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${themeClasses.titleText}`}>
                    <span className="flex items-center gap-4 text-amber-500"><Clock className="w-6 h-6 md:w-8 md:h-8" /> JEJAK DIGITAL CLOUD</span>
                    <span className="bg-amber-500/10 text-amber-600 px-6 py-2 rounded-full font-mono font-black border border-amber-500/20 w-fit">{history.length} RIWAYAT</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {history.map((item) => (
                        <div key={item.id} onClick={() => loadProject(item)} className={`group border p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] transition-all cursor-pointer flex gap-4 md:gap-5 items-center ${themeClasses.historyItem}`}>
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex-shrink-0 bg-[#070709] border-2 border-amber-900/10 flex items-center justify-center">
                            <Languages className="w-5 h-5 md:w-6 md:h-6 text-amber-500 opacity-40" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] md:text-[11px] font-black line-clamp-1 uppercase tracking-tight mb-1 ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`}>{String(item.prompt)}</p>
                            <span className="text-[8px] font-black opacity-50 text-amber-600 uppercase tracking-tighter">CLOUD SYNCED</span>
                        </div>
                        <button onClick={(e) => deleteHistoryItem(e, item.id)} className="text-zinc-500 hover:text-red-500 transition-colors p-2 opacity-0 group-hover:opacity-100 shadow-xl"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>

      {/* Footer */}
      {}
      <footer className={`mt-20 py-16 border-t transition-all duration-300 ${themeClasses.header}`}>
        <div className="max-w-7xl mx-auto px-4 text-center scale-90 md:scale-75">
          <div className="flex flex-col items-center gap-3 mb-10">
              <div className={`p-4 rounded-full border-[3px] shadow-2xl ${theme === 'dark' ? 'bg-[#0f0f12] border-amber-500/20' : 'bg-white border-zinc-950 shadow-black'}`}>
                <User className="w-10 h-10 md:w-14 md:h-14 text-white" />
              </div>
              <p className={`text-2xl md:text-5xl font-black uppercase tracking-[0.6em] ${themeClasses.creatorName}`}>Armansyah</p>
              <p className="text-[10px] md:text-lg font-bold opacity-70 uppercase tracking-[0.4em] mt-2">Narasumber Koding & Kecerdasan Artifisial Kemendikdasmen 2025</p>
              
              <div className="flex justify-center items-center gap-6 mt-10">
                {SOCIAL_LINKS.map(({ id, Icon, url, color }) => (
                  <a key={id} href={url} target="_blank" rel="noopener noreferrer" className={`transition-all duration-300 p-4 rounded-2xl border border-zinc-800 shadow-2xl ${theme === 'dark' ? 'bg-[#121218]' : 'bg-zinc-950 shadow-inner shadow-black'} ${color} hover:-translate-y-3 active:scale-90`}>
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </a>
                ))}
              </div>
          </div>

          <div className={`max-w-5xl mx-auto p-12 md:p-14 rounded-[4rem] border text-left space-y-6 text-xs md:text-sm font-bold transition-all shadow-2xl ${theme === 'dark' ? 'bg-[#121218]/80 border-amber-900/10 text-zinc-400 shadow-black' : 'bg-white border-zinc-200 text-zinc-600 shadow-zinc-100 shadow-black'}`}>
            <p className="font-black text-amber-600 uppercase tracking-widest border-b border-amber-500/10 pb-4 mb-6 text-base md:text-xl">Informasi Sistem & Disclaimer</p>
            <p className="flex items-start gap-5">
                <span className="text-amber-600 text-2xl font-black">•</span>
                <span><strong>Berejo (Being Researcher and Innovator with Joyful Experiment):</strong> Dibuat berdasar pengalaman dan pengamatan serta kebutuhan publik terhadap pembuatan gambar berbasis AI dengan fitur professional</span>
            </p>
            <p className="flex items-start gap-5">
                <span className="text-amber-600 text-2xl font-black">•</span>
                <span>Istilah <strong>"Berejo"</strong> dalam bahasa Palembang berarti ikhtiar nyata atau upaya bersungguh-sungguh dalam menyelesaikan tantangan.</span>
            </p>
            <p className="flex items-start gap-5 pl-8 border-l-4 border-amber-500/30 bg-amber-500/5 py-2 text-[11px] md:text-sm text-amber-600 font-black">
                <span>Istilah Berejo digunakan karena Cekguarman ini adalah orang Palembang asli (aspek promosi dan pelestarian bahasa daerah).</span>
            </p>
            <div className="mt-10 overflow-hidden rounded-[2rem] border-2 border-slate-100 shadow-lg bg-white">
              <div className="p-4 text-center">
                <p className="italic font-bold text-red-600 text-[9px] md:text-xs leading-relaxed tracking-tight uppercase">
                    Berejo Gambar can make mistakes. Check your result wisely. AI results are not always accurate and AI output requires human review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Styled Sheets */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 40px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .animate-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 3s linear infinite; }
        select, textarea { font-size: 16px !important; color: inherit; }
        select option { background-color: #000; color: #fff; }
        input[type="range"] { -webkit-appearance: none; cursor: pointer; background: transparent; }
        input[type="range"]::-webkit-slider-runnable-track { height: 5px; background: #27272a; border-radius: 10px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #f59e0b; margin-top: -6.5px; box-shadow: 0 0 12px rgba(245,158,11,0.4); }
      `}} />
    </div>
  );
};

export default App;
