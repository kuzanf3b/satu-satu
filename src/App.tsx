import { useState, useRef, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Camera, Mic, MicOff, CheckCircle2, Play, Pause, 
  RotateCcw, Compass, ArrowLeft, ArrowRight, Upload, AlertCircle, 
  Volume2, Heart, HelpCircle, Check, Info, RefreshCw, Moon, Clock, UserCheck
} from "lucide-react";
import confetti from "canvas-confetti";
import { TaskMission, MicroStep, PresetItem } from "./types";
import presetDeskImg from "./assets/images/preset_desk_1779457590371.png";
import presetRoomImg from "./assets/images/preset_room_1779457613968.png";

// High quality native synthesizers for premium micro-interactions (e.g. relaxing bells, success chimes)
function playCozySynthBell(freq: number, duration: number, type: OscillatorType = "sine") {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    // Soft swell & fade envelope
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);

    // Release AudioContext to prevent exhaustion of native browser resources
    setTimeout(() => {
      try {
        if (audioCtx.state !== "closed") {
          audioCtx.close();
        }
      } catch (err) {}
    }, duration * 1000 + 500);
  } catch (e) {
    console.warn("Audio Context synth blocked or unsupported.", e);
  }
}

// Play premium cascading Dopamine Chimes (Fairy arpeggio design)
function playDopamineChime() {
  const notes = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6 (Sweet pentatonic major-9th chord roll)
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playCozySynthBell(freq, 0.45, "sine");
    }, idx * 75);
  });
}

// Spark subtle, elegant pastel flower petals & zen confetti celebration
function triggerZenCelebration() {
  const colors = ["#b2c7a5", "#dfebdb", "#fcf9f6", "#e4ccb9", "#f1e5d7", "#dca7a1"];
  
  // Left corner petal spray
  confetti({
    particleCount: 45,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 0.85 },
    colors: colors,
    ticks: 180,
    gravity: 0.8,
    scalar: 1.15
  });
  
  // Right corner petal spray
  confetti({
    particleCount: 45,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 0.85 },
    colors: colors,
    ticks: 180,
    gravity: 0.8,
    scalar: 1.15
  });

  // Soft slow-falling center drizzle (petal-like circles)
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 90,
      spread: 75,
      origin: { x: 0.5, y: 0.35 },
      colors: colors,
      ticks: 140,
      gravity: 0.65,
      scalar: 1.25
    });
  }, 350);
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<"welcome" | "hub" | "anchor" | "isolation" | "insights">("welcome");
  const [activeTab, setActiveTab] = useState<"visual" | "voice" | "text">("visual");
  
  // State for task inputs
  const [textVent, setTextVent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  // API loading states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Active Isolated Task Mission
  const [mission, setMission] = useState<TaskMission | null>(null);
  const isAllStepsCompleted = mission ? mission.completedSteps.every(x => x === true) : false;
  const [streakCount, setStreakCount] = useState<number>(() => {
    return Number(localStorage.getItem("urai_streak") || "0");
  });

  // Body Doubling Companion Stats
  const [companionActive, setCompanionActive] = useState(false);
  const [companionTimer, setCompanionTimer] = useState(5 * 60); // default 5 mins
  const [companionPreset, setCompanionPreset] = useState<number>(5); // 5 mins
  const [breathingPhase, setBreathingPhase] = useState<"Hirup" | "Tahan" | "Hembus" | "Rehat">("Hirup");
  const [breathingCounter, setBreathingCounter] = useState(4);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [voiceVoice, setVoiceVoice] = useState<string>("Kore"); // Puck, Charon, Kore, Fenrir, Zephyr

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playAudioRef = useRef<AudioBufferSourceNode | null>(null);
  const speechSeqRef = useRef<number>(0);
  const decompressSeqRef = useRef<number>(0);

  // Focus Coach Insights (From Slide Deck)
  const [currentInsightSlide, setCurrentInsightSlide] = useState(0);
  const insights = [
    {
      title: "The Cognitive Crisis",
      subtitle: "Kenapa kita menunda hal yang kita tahu harus dilakukan.",
      concept: "Disfungsi Eksekutif",
      desc: "Otak mengalami kemacetan saat menyusun prioritas. Ini bukan kemalasan, melainkan beban kognitif berlebih.",
      bullet: "Respon alami otak terhadap informasi yang terlalu menumpuk."
    },
    {
      title: "The Problem: Task Paralysis",
      subtitle: "Daftar tugas panjang membuat kita membeku.",
      concept: "Kecemasan Tugas",
      desc: "Sasaran abstrak memicu rasa takut gagal. Menunda tugas menjadi tameng perlindungan emosi sementara.",
      bullet: "SatuSatu menyaring kebisingan pikiran agar menjadi tugas nyata."
    },
    {
      title: "Aesthetic Philosophy: The Zen Shield",
      subtitle: "Menjaga kedamaian mental saat bekerja.",
      concept: "Fokus Terisolasi",
      desc: "Menampilkan hanya satu instruksi kecil sekali waktu akan meredakan stres akibat pilihan berlebih.",
      bullet: "Tanpa scroll panjang, fokus pada langkah aktif saat ini."
    }
  ];

  // Presets so that the user doesn't face empty screens
  const presets: PresetItem[] = [
    {
      id: "preset_desk",
      title: "Meja Kerja Berantakan",
      type: "visual",
      description: "Urai gelas kopi, kertas berserakan, dan kabel melilit di meja.",
      imageUrl: presetDeskImg
    },
    {
      id: "preset_room",
      title: "Pakaian Menumpuk",
      type: "visual",
      description: "Urai tumpukan baju kotor atau cucian meluap di kamar.",
      imageUrl: presetRoomImg
    },
    {
      id: "preset_voice_frustrated",
      title: "Curahan Suara (Email & Cucian)",
      type: "voice",
      description: "Suara acak saat pusing memikirkan cucian dan email masuk.",
      sampleText: "Duh gila ya email masuk banyak banget ada kali 15 belum dibales, mana cucian baju numpuk, trus ntar malem harus masak tapi bahan belom beli, kayaknya mau nangis aja pusing gatau mau mulai dari mana..."
    },
    {
      id: "preset_text_chaos",
      title: "Venting Teks (Skripsi & Dapur)",
      type: "text",
      description: "Ketik acak tentang skripsi lambat, piring kotor, kucing lapar.",
      sampleText: "Harus beresin skripsi bab 3 tapi piring kotor di dapur numpuk bau banget, kucing meong meong lapar sedangkan pakan abis di luar lagi hujan deras cemas banget tolong bantu urai!"
    }
  ];

  // Breathing Box Timer Animation Effect
  useEffect(() => {
    if (companionActive) {
      breathingIntervalRef.current = setInterval(() => {
        setBreathingCounter((prev) => {
          if (prev <= 1) {
            setBreathingPhase((phase) => {
              switch (phase) {
                case "Hirup": return "Tahan";
                case "Tahan": return "Hembus";
                case "Hembus": return "Rehat";
                case "Rehat": return "Hirup";
                default: return "Hirup";
              }
            });
            return 4; // Reset to 4 seconds box breathing rate
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    }
    return () => {
      if (breathingIntervalRef.current) clearInterval(breathingIntervalRef.current);
    };
  }, [companionActive]);

  // Pomodoro Countdown Timer
  useEffect(() => {
    if (companionActive && companionTimer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setCompanionTimer((prev) => {
          if (prev <= 1) {
            // Timer Finished! Play a beautiful synth audio chime
            playCozySynthBell(523.25, 1.5, "triangle"); // C5 sound
            setTimeout(() => playCozySynthBell(659.25, 1.5, "triangle"), 250); // E5 sound
            setCompanionActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [companionActive, companionTimer]);

  // Record Duration Counter
  useEffect(() => {
    if (isRecording) {
      recordIntervalRef.current = setInterval(() => {
        setRecordingSeconds(p => p + 1);
      }, 1000);
    } else {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, [isRecording]);

  // Load streak from localStorage on mount
  useEffect(() => {
    const savedStreak = localStorage.getItem("urai_streak");
    if (savedStreak) setStreakCount(Number(savedStreak));
  }, []);

  // Format time display MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Convert File object to base64
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMime(file.type);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        playCozySynthBell(392, 0.4); // soft feedback
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Voice Recording Functionality
  const toggleRecording = async () => {
    if (loading) return;
    if (isRecording) {
      // STOP RECORDING
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        playCozySynthBell(293.66, 0.5); // low end bell sound
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      // START RECORDING
      setVoiceTranscript("");
      setInterimTranscript("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          setAudioUrl(URL.createObjectURL(blob));

          // Convert blob to base64 string
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(",")[1];
            setAudioBase64(base64String);
          };
          reader.readAsDataURL(blob);
          playCozySynthBell(440, 0.5); // beautiful audio note A4
        };

        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
        playCozySynthBell(440, 0.2);
        playCozySynthBell(554.37, 0.2, "sine");

        // Speech Recognition Setup
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = "id-ID";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let interimTrans = "";
            let finalTrans = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcriptChunk = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTrans += transcriptChunk;
              } else {
                interimTrans += transcriptChunk;
              }
            }
            if (finalTrans) {
              setVoiceTranscript(prev => {
                const cleanPrev = prev.trim();
                const cleanFinal = finalTrans.trim();
                if (cleanPrev.endsWith(cleanFinal) || cleanPrev.includes(cleanFinal)) {
                  return prev;
                }
                const result = cleanPrev ? `${cleanPrev} ${cleanFinal}` : cleanFinal;
                setTextVent(result); // sync to textVent
                return result;
              });
            }
            if (interimTrans) {
              setInterimTranscript(interimTrans);
            } else {
              setInterimTranscript("");
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition error", event.error);
          };

          recognition.onend = () => {
            console.log("Speech recognition stopped");
          };

          recognitionRef.current = recognition;
          recognition.start();
        }
      } catch (err) {
        console.error("Microphone denied", err);
        setErrorMessage("Gagal mengakses mikrofon. Silakan gunakan preset atau input teks venting.");
      }
    }
  };

  // Select Preset to auto-fill inputs
  const applyPreset = (preset: PresetItem) => {
    if (loading) return;
    playCozySynthBell(523.25, 0.3);
    if (preset.type === "text") {
      setTextVent(preset.sampleText || "");
      setActiveTab("text");
    } else if (preset.type === "voice") {
      setTextVent(preset.sampleText || "");
      setVoiceTranscript(preset.sampleText || "");
      // Mock an audio note preset block
      setAudioBase64("MOCKED_AUDIO_DATA");
      setAudioUrl("#preset-audio");
      setActiveTab("voice");
    } else if (preset.type === "visual") {
      // Use the premium unsplash preview image if available, else a base64 dot
      setSelectedImage(preset.imageUrl || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==");
      setImageMime("image/png");
      setActiveTab("visual");
    }
  };

  // Submit and Decompress Logic
  const handleDecompress = async () => {
    setLoading(true);
    setErrorMessage(null);
    playCozySynthBell(523.25, 0.4);

    decompressSeqRef.current += 1;
    const currentSeq = decompressSeqRef.current;

    try {
      let endpoint = "/api/decompress-text";
      let body: any = {};

      if (activeTab === "visual") {
        if (!selectedImage) {
          throw new Error("Pilih atau unggah foto kekacauan fisik terlebih dahulu.");
        }
        setLoadingStep("Menganalisis objek fisik spasial...");
        endpoint = "/api/decompress-visual";
        body = {
          imageBase64: selectedImage,
          mimeType: imageMime
        };
      } else if (activeTab === "voice") {
        if (!audioBase64 && !textVent && !voiceTranscript) {
          throw new Error("Lakukan rekaman suara terlebih dahulu atau gunakan preset suara.");
        }
        setLoadingStep("Menyaring emosi riuh dan memprioritaskan 3 tugas utama...");
        endpoint = "/api/decompress-audio";
        // If it is a dummy preset sound, we can pass textVent fallback inside
        body = {
          audioBase64: audioBase64 || "PRESET",
          mimeType: "audio/webm",
          textFallback: voiceTranscript || textVent
        };
      } else {
        if (!textVent.trim()) {
          throw new Error("Masukkan beban pikiranmu pada kolom teks venting.");
        }
        setLoadingStep("Memilah kekacauaan kognitif menjadi misi ringan...");
        endpoint = "/api/decompress-text";
        body = { textPrompt: textVent };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (currentSeq !== decompressSeqRef.current) {
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Gagal menghubungi asisten pelatih SatuSatu.");
      }

      const data = await response.json();

      if (currentSeq !== decompressSeqRef.current) {
        return;
      }
      
      // Setup the mission state securely
      const newMission: TaskMission = {
        id: "mission_" + Date.now(),
        task_title: data.task_title || "Misi Mikro SatuSatu",
        steps: data.steps && data.steps.length > 0 ? data.steps : [
          { instruction: "Tarik napas dalam-dalam selama 5 hitungan.", estimated_time: "1" },
          { instruction: "Tata 1 barang terdekat ke tempatnya.", estimated_time: "3" }
        ],
        anchor_step: data.anchor_step || "Jangan rapikan dulu. Cukup dekatkan cangkir kopi / gelas terdekat tepat 5 sentimeter ke arahmu.",
        affirmation: data.affirmation || "Kamu melakukan hal hebat dengan mengawalinya perlahan.",
        createdAt: Date.now(),
        completedSteps: new Array(data.steps ? data.steps.length : 2).fill(false),
        currentStepIndex: 0
      };

      setMission(newMission);
      setCurrentScreen("anchor");
      
      // Auto speech intro from ADHD Coach about the 10-second anchor!
      generateCoachSpeech(`Saya menemukan sebuah langkah jangkar 10 detik pemicu energimu. ${newMission.anchor_step}`);
      
      // Play a beautiful success tone
      playCozySynthBell(523.25, 0.4);
      setTimeout(() => playCozySynthBell(659.25, 0.4), 150);
      setTimeout(() => playCozySynthBell(783.99, 0.6), 300);

    } catch (err: any) {
      if (currentSeq === decompressSeqRef.current) {
        console.error(err);
        setErrorMessage(err.message || "Terdapat kendala jaringan. Coba lagi.");
        playCozySynthBell(220, 0.6, "sawtooth");
      }
    } finally {
      if (currentSeq === decompressSeqRef.current) {
        setLoading(false);
        setLoadingStep("");
      }
    }
  };

  // Programmatic global speech-cancel mechanism
  const stopAllSpeech = () => {
    speechSeqRef.current += 1;
    setTtsPlaying(false);
    if (playAudioRef.current) {
      try {
        playAudioRef.current.stop();
      } catch (e) {}
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Speaking with Coach Speech TTS Generator
  const generateCoachSpeech = async (phraseText: string) => {
    stopAllSpeech();
    const mySeq = speechSeqRef.current;

    setTtsPlaying(true);
    try {
      const res = await fetch("/api/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: phraseText, voice: voiceVoice })
      });

      if (mySeq !== speechSeqRef.current) {
        return;
      }

      if (!res.ok) {
        // Safe standard fallback using browser Speech Synthesis if server lacks API key
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(phraseText);
          utterance.lang = "id-ID";
          utterance.rate = 1.0;
          utterance.onend = () => {
            if (mySeq === speechSeqRef.current) {
              setTtsPlaying(false);
            }
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTtsPlaying(false);
        }
        return;
      }

      const outputBytes = await res.json();
      
      if (mySeq !== speechSeqRef.current) {
        return;
      }

      if (outputBytes.audioBase64) {
        // Decode Signed 16-bit PCM and play via Web Audio API 24000Hz (native Gemini TTS format)
        const binaryString = atob(outputBytes.audioBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const dataView = new DataView(arrayBuffer);
        const numSamples = len / 2;
        const float32Data = new Float32Array(numSamples);
        
        for (let i = 0; i < numSamples; i++) {
          const sample = dataView.getInt16(i * 2, true);
          float32Data[i] = sample / 32768;
        }

        const audioBuffer = audioCtx.createBuffer(1, numSamples, 24000);
        audioBuffer.getChannelData(0).set(float32Data);
        
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          if (mySeq === speechSeqRef.current) {
            setTtsPlaying(false);
          }
          try {
            audioCtx.close();
          } catch (err) {}
        };

        if (mySeq !== speechSeqRef.current) {
          try {
            audioCtx.close();
          } catch (err) {}
          return;
        }

        source.start(0);
        playAudioRef.current = source;
      } else {
        // Fallback to browser SpeechSynthesis so the audio is still read out loud seamlessly!
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(phraseText);
          utterance.lang = "id-ID";
          utterance.rate = 1.0;
          utterance.onend = () => {
            if (mySeq === speechSeqRef.current) {
              setTtsPlaying(false);
            }
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTtsPlaying(false);
        }
      }
    } catch (e) {
      console.warn("TTS Player error, fallback text speech", e);
      if (mySeq === speechSeqRef.current) {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(phraseText);
          utterance.lang = "id-ID";
          utterance.rate = 1.0;
          utterance.onend = () => {
            if (mySeq === speechSeqRef.current) {
              setTtsPlaying(false);
            }
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTtsPlaying(false);
        }
      }
    }
  };

  // Complete Active Step mechanism
  const handleMarkStepComplete = (index: number) => {
    if (!mission) return;

    const updatedCompleted = [...mission.completedSteps];
    updatedCompleted[index] = true;

    const isAllDone = updatedCompleted.every(val => val === true);
    
    let nextIndex = mission.currentStepIndex;
    if (nextIndex < mission.steps.length - 1) {
      nextIndex += 1;
    }

    const updatedMission = {
      ...mission,
      completedSteps: updatedCompleted,
      currentStepIndex: nextIndex
    };

    setMission(updatedMission);

    if (isAllDone) {
      // Trigger interactive pastel petal confetti celebration!
      triggerZenCelebration();

      // Update streak
      const nextStreak = streakCount + 5;
      setStreakCount(nextStreak);
      localStorage.setItem("urai_streak", String(nextStreak));

      // Play major chords & cascading chime
      playCozySynthBell(523.25, 0.8, "sine"); // C
      playCozySynthBell(659.25, 0.8, "sine"); // E
      playCozySynthBell(783.99, 0.8, "sine"); // G
      playCozySynthBell(1046.50, 1.2, "sine"); // High C
      setTimeout(() => {
        playDopamineChime();
      }, 250);

      const phrase = `Luar biasa! Kamar atau tugasmu selesai sepenuhnya. Kemenangan luar biasa untuk hari ini! Streak poin kamu sekarang bertambah ${nextStreak}`;
      generateCoachSpeech(phrase);
    } else {
      // Play a beautiful calming dopamine step chime
      playDopamineChime();

      // Say supportive voice for next step
      const phrase = `Langkah bagus! Mari berlanjut ke langkah baru: ${updatedMission.steps[nextIndex].instruction}`;
      generateCoachSpeech(phrase);
    }
  };

  // Step backward navigation
  const handleStepPrevious = () => {
    if (!mission || mission.currentStepIndex === 0) return;
    playCozySynthBell(349.23, 0.3); // F4
    setMission({
      ...mission,
      currentStepIndex: mission.currentStepIndex - 1
    });
  };

  // Reset Input Panel
  const clearInputs = () => {
    setTextVent("");
    setSelectedImage(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setErrorMessage(null);
    playCozySynthBell(220, 0.3);
  };

  // Change Body Doubling Focus interval
  const chooseCompanionTimer = (minutes: number) => {
    setCompanionPreset(minutes);
    setCompanionTimer(minutes * 60);
    playCozySynthBell(392, 0.3);
  };

  return (
    <div className="min-h-screen bg-cream text-slate-text flex flex-col relative overflow-x-hidden antialiased font-sans transition-colors duration-500 gradient-bg">
      
      {/* Decorative Aura Background Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sage/5 rounded-full filter blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-sage/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* Main Bar */}
      {currentScreen !== "anchor" && currentScreen !== "isolation" && (
        <header className="border-b border-sage/10 bg-cream/70 backdrop-blur-md px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-2.5 md:space-x-3 cursor-pointer group" onClick={() => setCurrentScreen("welcome")}>
            <div className="h-9 w-9 md:h-11 md:w-11 rounded-xl bg-sage/10 border border-sage/25 flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-tr from-sage/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {/* Concentric Step Arch with a beautifully styled large text "1" */}
              <div className="flex items-center justify-center relative select-none w-full h-full">
                <div className="absolute w-6.5 h-6.5 rounded-full border border-sage/25 animate-pulse"></div>
                <div className="absolute w-4.5 h-4.5 rounded-full border border-sage/15 border-dashed animate-spin" style={{ animationDuration: "20s" }}></div>
                <span className="font-serif font-black text-base md:text-lg text-sage leading-none z-10 relative">1</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-serif font-bold tracking-tight text-slate-text leading-none md:leading-normal flex items-center gap-1.5">
                SatuSatu
                <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block animate-pulse"></span>
              </h1>
              <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-slate-text/60 scale-90 origin-left md:scale-100">ADHD Cognitive Armor</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Daily Streak Indicator */}
            <div className="flex items-center space-x-1 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full bg-sage/10 text-slate-text border border-sage/20 text-[10px] md:text-xs font-mono font-medium" title="Kemenangan Mikro Hari Ini">
              <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 text-sage fill-sage animate-pulse flex-shrink-0" />
              <span className="hidden sm:inline">Streak:</span>
              <span className="text-slate-text font-bold">{streakCount} pts</span>
            </div>

            <button 
              onClick={() => setCurrentScreen("insights")}
              className="p-1 px-1.5 rounded-full hover:bg-sage/10 text-slate-text/70 hover:text-slate-text transition-colors flex items-center"
              title="Wawasan Regulasi Emosi"
            >
              <Compass className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>
      )}

      {/* Navigation Main Block router */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center relative z-10">
        <AnimatePresence mode="wait">
          
          {/* Screen 1: Welcome Portal to soothe anxiety */}
          {currentScreen === "welcome" && (
            <motion.div
              key="welcome-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-xl mx-auto py-6 md:py-12 flex flex-col items-center"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-sage/5 flex items-center justify-center p-3 mb-6 md:mb-8 ring-8 ring-sage/10 relative group">
                {/* Floating breathing soft shapes representing cognitive calm */}
                <div className="absolute inset-0 rounded-full border border-sage/20 animate-pulse"></div>
                {/* Concentric Zen ripples */}
                <div className="absolute inset-3 rounded-full border border-sage/15 border-dashed animate-spin" style={{ animationDuration: "50s" }}></div>
                <div className="absolute inset-6 rounded-full border border-sage/10"></div>
                
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-[#fcf9f6] shadow-sm flex items-center justify-center relative overflow-hidden">
                  {/* Modern Progressive Steps behind the number 1 */}
                  <div className="absolute bottom-4 flex items-end justify-center space-x-1 sm:space-x-1.5 opacity-25">
                    <div className="w-4 h-1.5 bg-sage/35 rounded-t"></div>
                    <div className="w-4 h-4 bg-sage/50 rounded-t"></div>
                    <div className="w-4 h-7 bg-sage/75 rounded-t"></div>
                  </div>
                  
                  {/* The beautifully bold large centered "1" */}
                  <div className="relative select-none z-10">
                    <span className="font-serif font-black text-6xl md:text-7xl text-sage drop-shadow-[0_2px_4px_rgba(111,139,99,0.15)] block transform translate-y-[-2px]">1</span>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl md:text-5xl font-serif font-black tracking-tight mb-4 text-slate-text leading-tight px-2">
                Mari Kita Urai Bersama.
              </h2>
              
              <p className="text-xs md:text-md text-slate-text/80 mb-8 max-w-sm leading-relaxed font-sans font-light px-4">
                Ubah kekacauan pikiran atau tumpukan area yang berantakan menjadi tugas mikro secara satu per satu tanpa rasa cemas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full justify-center px-4">
                <button
                  onClick={() => {
                    setCurrentScreen("hub");
                    playCozySynthBell(440, 0.4);
                  }}
                  className="px-8 py-4 bg-sage hover:bg-sage/90 text-cream rounded-full font-medium transition-all shadow-md shadow-sage/10 hover:shadow-lg flex items-center justify-center space-x-2 text-sm"
                >
                  <span>Mulai Mengurai</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setCurrentScreen("insights");
                    playCozySynthBell(330, 0.4);
                  }}
                  className="px-6 py-4.5 bg-sage/10 hover:bg-sage/15 text-slate-text rounded-full text-xs font-medium transition-colors flex items-center justify-center space-x-2 border border-sage/10"
                >
                  <Compass className="w-4 h-4" />
                  <span>Disfungsi Eksekutif ADHD</span>
                </button>
              </div>

              {/* Serene Insight Footer */}
              <div className="mt-16 pt-8 border-t border-sage/10 w-full text-slate-text/50 text-xs">
                <blockquote className="italic">
                  &ldquo;Kamu tidak malas. Kamu hanya sedang menghadapi kemacetan kognitif. Mari melangkah perlahan di sini.&rdquo;
                </blockquote>
              </div>
            </motion.div>
          )}

          {/* Screen 2: Decompressor Hub Panel */}
          {currentScreen === "hub" && (
            <motion.div
              key="hub-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col"
            >
              {/* Back to Home Button */}
              <button 
                onClick={() => { setCurrentScreen("welcome"); playCozySynthBell(220, 0.3); }}
                className="self-start mb-6 flex items-center space-x-2 text-xs font-medium text-slate-text/60 hover:text-slate-text transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Pintu Masuk</span>
              </button>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-[#81A172] font-semibold">SatuSatu Engine</span>
                <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight mt-1 text-slate-text">
                  Ada Apa Hari Ini?
                </h2>
                <p className="text-xs text-slate-text/70 mt-1 font-light">
                  Pilihlah media input yang paling nyaman bagi tingkat energimu saat ini.
                </p>
              </div>

              {/* Preset Selector Rail */}
              <div className="mb-6 p-3 md:p-4 bg-sage/5 rounded-2xl border border-sage/10">
                <span className="text-xs uppercase tracking-wider text-sage/80 font-bold block mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span>✨ Sandbox Contoh Uji Multi-Modal</span>
                  <span className="text-[9px] md:text-[10px] text-slate-text/50 font-normal font-sans normal-case">Klik acak untuk langsung memuat contoh input</span>
                </span>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => !loading && applyPreset(preset)}
                      disabled={loading}
                      className={`text-left bg-cream p-3 rounded-xl border border-sage/20 hover:border-sage transition-all text-xs hover:shadow-sm flex flex-col justify-between h-24 ${
                        loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                      }`}
                    >
                      <span className="font-serif font-bold text-slate-text truncate w-full">{preset.title}</span>
                      <p className="text-[10px] text-slate-text/70 line-clamp-2 mt-1 leading-normal">{preset.description}</p>
                      <span className="text-[9px] uppercase tracking-widest text-sage mt-2 font-mono flex items-center space-x-1">
                        {preset.type === "visual" && <Camera className="w-2.5 h-2.5 mr-0.5" />}
                        {preset.type === "voice" && <Mic className="w-2.5 h-2.5 mr-0.5" />}
                        {preset.type === "text" && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
                        <span>{preset.type}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-sage/10 mb-6 gap-1 md:gap-2 overflow-x-auto scrollbar-none snap-x whitespace-nowrap">
                <button
                  onClick={() => { if (loading) return; setActiveTab("visual"); playCozySynthBell(330, 0.2); }}
                  disabled={loading}
                  className={`pb-2.5 md:pb-3 px-2 md:px-3 font-serif font-bold text-xs md:text-sm tracking-wide transition-all border-b-2 flex items-center space-x-1.5 md:space-x-2 flex-shrink-0 snap-start ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    activeTab === "visual"
                      ? "border-sage text-sage"
                      : "border-transparent text-slate-text/50 hover:text-slate-text"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Gunakan Foto (Visual)</span>
                </button>
                
                <button
                  onClick={() => { if (loading) return; setActiveTab("voice"); playCozySynthBell(392, 0.2); }}
                  disabled={loading}
                  className={`pb-2.5 md:pb-3 px-2 md:px-3 font-serif font-bold text-xs md:text-sm tracking-wide transition-all border-b-2 flex items-center space-x-1.5 md:space-x-2 flex-shrink-0 snap-start ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    activeTab === "voice"
                      ? "border-sage text-sage"
                      : "border-transparent text-slate-text/50 hover:text-slate-text"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Curah Suara (Audio)</span>
                </button>

                <button
                  onClick={() => { if (loading) return; setActiveTab("text"); playCozySynthBell(440, 0.2); }}
                  disabled={loading}
                  className={`pb-2.5 md:pb-3 px-2 md:px-3 font-serif font-bold text-xs md:text-sm tracking-wide transition-all border-b-2 flex items-center space-x-1.5 md:space-x-2 flex-shrink-0 snap-start ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    activeTab === "text"
                      ? "border-sage text-sage"
                      : "border-transparent text-slate-text/50 hover:text-slate-text"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span>Ketik Teks (Brain Dump)</span>
                </button>
              </div>

              {/* Tab Contents Frame */}
              <div className="bg-cream p-4 md:p-6 rounded-2xl md:rounded-3xl border border-sage/15 shadow-sm min-h-[200px] flex flex-col justify-between">
                
                {activeTab === "visual" && (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="font-serif font-medium text-lg mb-2">Visual Decompressor</h3>
                      <p className="text-xs text-slate-text/70 mb-4 leading-relaxed">
                        Foto area kerjamu yang berantakan. AI akan menemukan 1 benda fisik terpenting untuk dipindahkan pertama kali agar memutus kelumpuhan kognitifmu.
                      </p>
                      
                      <div className="flex items-center space-x-3">
                        <label className={`bg-sage/15 hover:bg-sage/25 text-slate-text px-4 py-2.5 rounded-full text-xs font-semibold flex items-center space-x-2 transition-colors border border-sage/10 ${
                          loading ? "opacity-55 cursor-not-allowed pointer-events-none" : "cursor-pointer"
                        }`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Foto</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            disabled={loading}
                            className="hidden" 
                          />
                        </label>
                        {selectedImage && (
                          <button 
                            onClick={() => { if (loading) return; setSelectedImage(null); playCozySynthBell(220, 0.2); }}
                            disabled={loading}
                            className={`text-xs text-red-500 hover:underline ${loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-56 h-40 rounded-2xl bg-sage/5 border border-dashed border-sage/30 flex items-center justify-center overflow-hidden relative">
                      {selectedImage ? (
                        <div className="w-full h-full flex flex-col items-center justify-center relative bg-black/5 p-2">
                          <img 
                            src={selectedImage} 
                            alt="Kekacauan yang akan diurai" 
                            className="object-cover w-full h-full rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                          {/* Phase 1: Scanner Layar using Framer Motion absolute overlay */}
                          {loading && (
                            <motion.div 
                              className="absolute left-0 right-0 h-[3px] bg-emerald-400 shadow-[0_0_12px_#34d399] z-20"
                              initial={{ top: "0%" }}
                              animate={{ top: "100%" }}
                              transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
                            />
                          )}
                          {selectedImage.startsWith("data:") && selectedImage.length < 500 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-sage/15 backdrop-blur-sm p-3 text-center">
                              <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center mb-1 animate-pulse">
                                <Sparkles className="w-4 h-4 text-sage" />
                              </div>
                              <span className="text-[10px] uppercase tracking-widest text-[#4A5568] font-bold">Preset Aktif</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Camera className="w-8 h-8 text-slate-text/30 mx-auto mb-2" />
                          <span className="text-xs text-slate-text/40">Belum ada foto</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "voice" && (
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h3 className="font-serif font-medium text-lg mb-2">Audio Venting Decompressor</h3>
                      <p className="text-xs text-slate-text/70 mb-4 leading-relaxed">
                        Keluarkan beban pikiranmu secara acak lewat rekaman audio. AI akan memilah 3 prioritas utama dan mengabaikan kekhawatiran berlebih lainnya.
                      </p>

                      <div className="flex items-center space-x-4">
                        <button
                          onClick={toggleRecording}
                          disabled={loading}
                          className={`px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-2 ${
                            loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                          } ${
                            isRecording 
                              ? "bg-red-500 text-cream animate-pulse ring-4 ring-red-500/20"
                              : "bg-sage/15 hover:bg-sage/25 text-slate-text border border-sage/10"
                          }`}
                        >
                          {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                          <span>{isRecording ? `Hentikan Rekam (${recordingSeconds}s)` : "Rekam Suaraku"}</span>
                        </button>

                        {audioUrl && (
                          <div className="text-xs text-sage flex items-center space-x-1.5 font-mono font-bold animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-sage"></span>
                            <span>Curahan Suara Tersemat</span>
                          </div>
                        )}
                      </div>

                      {/* Real-time speech transcription & editable box */}
                      {(isRecording || voiceTranscript || interimTranscript) && (
                        <div className="mt-4 p-4 rounded-2xl bg-cream border border-sage/20 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sage flex items-center space-x-1.5">
                              {isRecording ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                  <span>Merekam & Mentranskrip...</span>
                                </>
                              ) : (
                                <span>Hasil Transkripsi Suara (Bisa Diedit):</span>
                              )}
                            </span>
                            {!isRecording && voiceTranscript && (
                              <button
                                onClick={() => {
                                  if (loading) return;
                                  setVoiceTranscript("");
                                  setInterimTranscript("");
                                  setTextVent("");
                                }}
                                disabled={loading}
                                className={`text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors ${
                                  loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                                }`}
                              >
                                Bersihkan
                              </button>
                            )}
                          </div>
                          
                          <textarea
                            value={voiceTranscript + (interimTranscript ? (voiceTranscript ? " " : "") + interimTranscript : "")}
                            onChange={(e) => {
                              if (loading) return;
                              const updatedText = e.target.value;
                              setVoiceTranscript(updatedText);
                              setTextVent(updatedText);
                            }}
                            disabled={loading}
                            placeholder="Mulai berbicara... Suaramu akan terkonversi otomatis menjadi teks di sini agar bisa kamu sesuaikan kembali."
                            className={`w-full h-24 bg-sage/5 text-xs rounded-xl p-3 border border-sage/15 focus:border-sage focus:outline-none resize-none leading-relaxed transition-all text-slate-text font-sans font-medium hover:border-sage/40 ${
                              loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          />
                          
                          {isRecording && (
                            <p className="mt-1.5 text-[10px] text-slate-text/50 italic">
                              *Silakan bicara dengan tenang dalam Bahasa Indonesia atau Inggris.
                            </p>
                          )}
                          {!isRecording && voiceTranscript && (
                            <p className="mt-1.5 text-[10px] text-emerald-600 font-medium">
                              ✓ Hasil transkripsi aman. Kamu bisa mengedit teks di atas jika ejaan kurang sesuai sebelum mengklik tombol dekompresi.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-56 h-40 bg-sage/5 border border-slate-text/5 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden">
                      {isRecording ? (
                        <div className="flex items-end justify-center space-x-1 w-full h-12">
                          <div className="w-1.5 bg-sage animate-pulse h-12" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-1.5 bg-sage animate-pulse h-8" style={{ animationDelay: "0.3s" }}></div>
                          <div className="w-1.5 bg-sage animate-pulse h-16" style={{ animationDelay: "0.5s" }}></div>
                          <div className="w-1.5 bg-sage animate-pulse h-10" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-1.5 bg-sage animate-pulse h-6" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <Mic className="w-8 h-8 text-slate-text/30 mx-auto mb-2" />
                          <span className="text-xs text-slate-text/40">Suaramu aman di sini</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "text" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-medium text-lg">Brain Dump Venting</h3>
                      <button 
                        onClick={() => { if (loading) return; setTextVent(""); }}
                        disabled={loading}
                        className={`text-[10px] text-slate-text/60 hover:text-slate-text ${
                          loading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                        }`}
                      >
                        Reset Teks
                      </button>
                    </div>
                    <textarea
                      placeholder="Ketik apa saja yang membebani pikiranmu... Contoh: harus cuci pakaian tapi skripsi telat dan kamar mandi sangat berantakan"
                      value={textVent}
                      onChange={(e) => { if (loading) return; setTextVent(e.target.value); }}
                      disabled={loading}
                      className={`w-full h-32 bg-cream text-sm rounded-2xl p-4 border border-sage/20 focus:border-sage focus:outline-none resize-none leading-relaxed transition-all ${
                        loading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                )}

                {/* Submitting Loading UI inside the card (or bottom anchor) */}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-100/50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {loading ? (
                  <div className="mt-6 p-4 bg-sage/5 rounded-2xl flex flex-col items-center justify-center border border-sage/10 relative overflow-hidden">
                    {/* Pulsing serene loading bar */}
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-sage/30 animate-pulse"></div>
                    <RefreshCw className="w-6 h-6 text-sage animate-spin mb-2" />
                    <span className="text-xs font-serif italic text-slate-text/80 font-bold">{loadingStep}</span>
                    <span className="text-[10px] text-slate-text/50 mt-1 uppercase tracking-wider font-mono">Diproses via Gemini AI</span>
                    <button
                      onClick={() => {
                        playCozySynthBell(164.81, 0.4);
                        decompressSeqRef.current += 1;
                        setLoading(false);
                      }}
                      className="mt-3 text-[10px] font-mono font-bold text-red-500/80 hover:text-red-600 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      [ Batalkan ]
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleDecompress}
                    className="mt-6 w-full py-4 bg-sage hover:bg-sage/90 text-cream rounded-2xl font-serif font-bold text-md tracking-wider transition-all shadow-md shadow-sage/10 flex items-center justify-center space-x-2 text-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mulai Urai Masalah</span>
                  </button>
                )}

              </div>
            </motion.div>
          )}

          {/* Screen: AI Micro-Habit Anchor (The Action Trigger) - ZERO CHOICE DIMMED FOCUS STATE */}
          {currentScreen === "anchor" && mission && (
            <motion.div
              key="anchor-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-[#0a0f0d]/95 backdrop-blur-md overflow-y-auto"
            >
              <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none"></div>
              
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
                className="bg-cream p-6 md:p-10 rounded-[30px] md:rounded-[40px] border border-sage/30 max-w-lg w-full max-h-[92vh] overflow-y-auto scrollbar-none shadow-2xl text-center relative flex flex-col justify-between"
              >
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-sage/10 rounded-full filter blur-xl"></div>
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-sage/10 rounded-full filter blur-xl"></div>

                <div className="flex flex-col items-center">
                  <span className="px-3 py-1 bg-sage/10 text-sage hover:bg-sage/15 transition-colors text-[10px] uppercase font-mono font-black tracking-widest border border-sage/15 rounded-full mb-4 md:mb-6">
                    ⚡ Langkah Pertama
                  </span>

                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-sage/5 flex items-center justify-center mb-4 md:mb-6 ring-4 ring-sage/10 relative">
                    <div className="absolute inset-1.5 rounded-full bg-sage/10 animate-ping opacity-60"></div>
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-sage relative z-10" />
                  </div>

                  <h3 className="text-lg md:text-xl font-serif font-black tracking-tight text-slate-text mb-2 md:mb-3">
                    Langkah Jangkar (10 Detik)
                  </h3>

                  <p className="text-[11px] md:text-xs font-sans font-medium text-slate-text/70 mb-4 md:mb-6 max-w-sm leading-relaxed px-2">
                    Jangan pikirkan hasil akhir. Cukup menangkan momentum pertamamu dengan aksi super ringan di bawah ini:
                  </p>

                  <div className="bg-sage/5 border border-sage/15 p-4 md:p-6 rounded-2xl md:rounded-3xl mb-6 md:mb-8 w-full shadow-inner">
                    <h4 className="text-md md:text-xl font-serif font-bold text-slate-text leading-relaxed">
                      &ldquo;{mission.anchor_step}&rdquo;
                    </h4>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      // Satisfying synthesis-harmonic dopamine cascade!
                      playCozySynthBell(261.63, 0.4); 
                      setTimeout(() => playCozySynthBell(329.63, 0.4), 100); 
                      setTimeout(() => playCozySynthBell(392.00, 0.4), 200); 
                      setTimeout(() => playCozySynthBell(523.25, 0.6), 320); 

                      const transPhrase = "Langkah jangkar berhasil dilalui! Hebat sekali. Mari kita mulai Misi Mikro sesungguhnya.";
                      generateCoachSpeech(transPhrase);

                      setStreakCount(prev => prev + 1);
                      localStorage.setItem("urai_streak", String(streakCount + 1));
                      
                      setCurrentScreen("isolation");
                    }}
                    className="w-full py-3.5 md:py-4 bg-sage hover:bg-[#6e8c5f] text-cream rounded-2xl font-serif font-bold text-xs tracking-wider transition-all shadow-lg shadow-sage/25 flex items-center justify-center space-x-3 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Selesai! Beri Saya Dopamin ⚡</span>
                  </motion.button>

                  <button
                    onClick={() => {
                      playCozySynthBell(330, 0.3);
                      setCurrentScreen("isolation");
                      generateCoachSpeech(`Mari masuk ke langkah mikro pertama.`);
                    }}
                    className="mt-3 md:mt-4 text-[11px] md:text-xs font-semibold text-slate-text/60 hover:text-slate-text transition-colors"
                  >
                    Lewati jangkar & langsung ke Misi Mikro
                  </button>

                  <button
                    onClick={() => {
                      playCozySynthBell(164.81, 0.4);
                      stopAllSpeech();
                      setCurrentScreen("hub");
                    }}
                    className="mt-2.5 md:mt-3 text-[11px] md:text-xs font-medium text-red-500/80 hover:text-red-600 transition-colors flex items-center space-x-1"
                  >
                    <span>&larr; Batalkan</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Screen 3: Card Isolation Focused Space (exactly 1 card shown) */}
          {currentScreen === "isolation" && mission && (
            <motion.div
              key="isolation-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col"
            >
              
              {/* Task Title Header */}
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sage/10 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-sage font-bold font-mono">Misi Aktif Terisolasi</span>
                  <h2 className="text-2xl font-serif font-black tracking-tight text-slate-text mt-1">
                    {mission.task_title}
                  </h2>
                </div>
                
                {/* Back to hub safely with anti-shame design */}
                <button
                  onClick={() => {
                    playCozySynthBell(164.81, 0.4); // E3 warm reset
                    stopAllSpeech();
                    setCurrentScreen("hub");
                  }}
                  className="px-4 py-2 bg-sage/5 hover:bg-sage/10 text-slate-text/70 hover:text-slate-text text-xs font-medium rounded-full border border-sage/10 transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Dekompresi Menu Utama</span>
                </button>
              </div>

              {/* Progress Stepper indicators (Single screen, NO scroll!) */}
              <div className="w-full bg-sage/5 h-2 rounded-full overflow-hidden mb-8 border border-sage/10 flex">
                {mission.steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`flex-1 h-full transition-all duration-300 ${
                      i === mission.currentStepIndex 
                        ? "bg-sage animate-pulse" 
                        : i < mission.currentStepIndex 
                          ? "bg-sage/75 border-r border-[#F9F5F0]" 
                          : "bg-transparent border-r border-[#4A5568]/5"
                    }`}
                  />
                ))}
              </div>

              {/* TWO COLUMN GRID: Left: Isolated Card, Right: Body Doubling Companion widget */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* COLUMN A: Card Isolation block */}
                <div className={`${isAllStepsCompleted ? "md:col-span-12 max-w-2xl mx-auto w-full" : "md:col-span-7"} flex flex-col`}>
                  
                  {/* The Isolated Card */}
                  {isAllStepsCompleted ? (
                    <motion.div 
                      key="all-steps-complete-card"
                      initial={{ scale: 0.96, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-cream p-5 md:p-8 rounded-[28px] md:rounded-[36.5px] border-2 border-sage shadow-xl min-h-[320px] md:min-h-[340px] flex flex-col justify-between relative overflow-hidden text-center bg-radial-gradient"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-sage/10 rounded-bl-[100px] pointer-events-none"></div>
                      
                      <div className="flex flex-col items-center my-auto py-4 md:py-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-sage/10 flex items-center justify-center mb-3 md:mb-4 relative ring-6 md:ring-8 ring-sage/5">
                          <Check className="w-6 h-6 md:w-8 md:h-8 text-sage stroke-[3px]" />
                          <div className="absolute inset-0 rounded-full border border-sage/30 animate-pulse"></div>
                        </div>
                        
                        <h3 className="text-xl md:text-3xl font-serif font-black tracking-tight text-slate-text mb-2">
                          Misi Selesai Sepenuhnya! 🎉
                        </h3>
                        
                        <p className="text-xs md:text-sm font-sans font-medium text-slate-text/75 max-w-sm leading-relaxed mb-4 md:mb-5 px-1 md:px-2">
                          Hebat sekali! Kamu berhasil mengurai dan menyelesaikan seluruh misi mikro tanpa tertunda. Jadikan ini sebagai kemenangan kognitif kecil hari ini!
                        </p>

                        <div className="inline-flex items-center space-x-2 px-3 md:px-4 py-1.5 md:py-2 bg-sage/15 border border-sage/35 text-slate-text text-[10px] md:text-xs rounded-full font-mono font-bold">
                          <span>🔥 Hadiah Streak: +5 Poin (Streak Aktif: {streakCount} pts)</span>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-6 pt-4 md:p-6 border-t border-sage/10 w-full">
                        <button
                          onClick={() => {
                            playCozySynthBell(523.25, 0.4);
                            stopAllSpeech();
                            setCurrentScreen("hub");
                          }}
                          className="w-full py-3.5 md:py-4 bg-sage hover:bg-[#6e8c5f] text-cream rounded-2xl font-serif font-bold text-xs md:text-sm tracking-widest transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Urai Beban Pikiran Lainnya</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-cream p-5 md:p-8 rounded-[28px] md:rounded-[36.5px] border-2 border-sage/20 shadow-md min-h-[320px] md:min-h-[340px] flex flex-col justify-between relative overflow-hidden transition-all duration-500 hover:border-sage bg-radial-gradient">
                      {/* Absolute visual corners overlay decoration */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-sage/5 rounded-bl-[28px] md:rounded-bl-[36.5px]"></div>
                      
                      {/* Stepper info banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-3 mb-4 md:mb-6">
                        <span className="text-[10px] md:text-[11px] font-mono font-bold uppercase tracking-widest text-sage px-3 py-1 bg-sage/10 rounded-full border border-sage/10 self-start">
                          Langkah {mission.currentStepIndex + 1} dari {mission.steps.length}
                        </span>
                        
                        {/* Interactive Time tag */}
                        <span className="text-xs text-slate-text/60 font-mono font-medium flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-sage" />
                          <span>Estimasi: {mission.steps[mission.currentStepIndex].estimated_time} menit</span>
                        </span>
                      </div>

                      {/* Highly polished isolated instructional panel using elegant Playfair Display display typography */}
                      <div className="flex-1 my-4 md:my-6 flex flex-col justify-center">
                        <h3 className="text-xl md:text-3xl font-serif font-bold text-slate-text leading-snug tracking-normal px-1">
                          {mission.steps[mission.currentStepIndex].instruction}
                        </h3>
                      </div>

                      {/* Step bottom action triggers */}
                      <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-sage/10 flex flex-col gap-2.5 md:gap-3">
                        
                        {/* Principal Big Finish Button */}
                        <button
                          onClick={() => handleMarkStepComplete(mission.currentStepIndex)}
                          className="w-full py-3.5 md:py-4.5 bg-sage hover:bg-[#6e8c5f] text-cream rounded-2xl font-serif font-black text-xs md:text-md tracking-wider transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" />
                          <span>Saya Sudah Menyelesaikan Ini</span>
                        </button>

                        {/* Directional buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 md:gap-3 mt-1">
                          <button
                            onClick={handleStepPrevious}
                            disabled={mission.currentStepIndex === 0}
                            className={`w-full sm:w-auto text-xs font-semibold px-4 py-2 rounded-full border border-sage/10 flex items-center justify-center space-x-1.5 transition-all ${
                              mission.currentStepIndex === 0 
                                ? "opacity-30 cursor-not-allowed" 
                                : "hover:bg-sage/5 text-slate-text/70"
                            }`}
                          >
                            <ArrowLeft className="w-3 h-3 flex-shrink-0" />
                            <span>Langkah Sebelumnya</span>
                          </button>
                          
                          {mission.currentStepIndex < mission.steps.length - 1 && (
                            <button
                              onClick={() => {
                                playCozySynthBell(440, 0.3);
                                setMission({ ...mission, currentStepIndex: mission.currentStepIndex + 1 });
                              }}
                              className="w-full sm:w-auto text-xs font-semibold hover:bg-sage/5 text-slate-text/70 px-4 py-2 rounded-full border border-sage/10 flex items-center justify-center space-x-1.5 transition-all"
                            >
                              <span>Lewati Sementara</span>
                              <ArrowRight className="w-3 h-3 flex-shrink-0" />
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Supportive Coach Affirmation bubble */}
                  <div className="mt-4 p-4 rounded-2xl bg-sage/5 border border-sage/10 flex items-start space-x-3 italic">
                    <Heart className="w-5 h-5 text-sage fill-sage/20 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-text/80 leading-relaxed font-sans">
                      &ldquo;{mission.affirmation}&rdquo;
                    </p>
                  </div>

                </div>

                {/* COLUMN B: Body Doubling Companion (Span 5) */}
                {!isAllStepsCompleted && (
                  <div className="md:col-span-5 flex flex-col space-y-6">
                     
                    {/* The Companion Circle Container */}
                  <div className="bg-cream/40 p-6 rounded-3xl border border-sage/10 flex flex-col items-center">
                    <span className="text-[10px] uppercase tracking-widest text-[#81A172] font-mono font-bold mb-4">Teman Fokus (AI Companion)</span>
                    
                    {/* Pulsing Breathing circle visual block */}
                    <div className="w-36 h-36 rounded-full bg-sage/5 border-2 border-sage/10 flex items-center justify-center p-3 relative mb-6">
                      
                      {/* Real time breathing animation overlay */}
                      <div className={`absolute inset-3 rounded-full bg-sage/10 border border-sage/30 transition-all duration-1000 ${
                        companionActive ? "scale-105 opacity-90 animate-pulse" : "scale-100 opacity-60"
                      }`} />

                      <div className="w-24 h-24 rounded-full bg-[#fcf9f6] shadow-sm flex flex-col items-center justify-center relative z-10">
                        <span className="text-[10px] uppercase text-slate-text/50 tracking-wider">
                          {companionActive ? breathingPhase : "Fokus"}
                        </span>
                        <span className="text-xl font-mono font-black text-slate-text mt-0.5">
                          {companionActive ? formatTime(companionTimer) : formatTime(companionPreset * 60)}
                        </span>
                        <span className="text-[9px] text-[#81A172] mt-0.5">
                          {companionActive ? `${breathingCounter}s` : "Interval"}
                        </span>
                      </div>
                    </div>

                    {/* Flexible pomodoro presets */}
                    <div className="flex gap-2 mb-6">
                      {[5, 15, 25].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => chooseCompanionTimer(mins)}
                          disabled={companionActive}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold tracking-wider transition-all border ${
                            companionPreset === mins 
                              ? "bg-sage border-sage text-cream" 
                              : "bg-cream/50 border-sage/20 text-slate-text hover:bg-cream"
                          } ${companionActive ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {mins} Menit
                        </button>
                      ))}
                    </div>

                    {/* Coach Voice Actor selection */}
                    <div className="w-full border-t border-sage/10 pt-4 mb-4 flex items-center justify-between text-xs">
                      <span className="text-slate-text/60">Suara:</span>
                      <select
                        value={voiceVoice}
                        onChange={(e) => {
                          setVoiceVoice(e.target.value);
                          playCozySynthBell(550, 0.4);
                        }}
                        className="bg-cream border border-sage/25 rounded-md px-2 py-0.5 text-xs text-slate-text font-serif focus:outline-none focus:border-sage"
                      >
                        <option value="Kore">Kore (Hangat)</option>
                        <option value="Zephyr">Zephyr (Lembut)</option>
                        <option value="Puck">Puck (Kasual)</option>
                        <option value="Charon">Charon (Tegas)</option>
                      </select>
                    </div>

                    {/* Companion Trigger Actions */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                      
                      {/* Play / Pause focus timer */}
                      <button
                        onClick={() => {
                          setCompanionActive(!companionActive);
                          playCozySynthBell(companionActive ? 300 : 500, 0.4);
                        }}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                          companionActive 
                            ? "bg-red-200 hover:bg-red-300 text-red-900 border border-red-300/10" 
                            : "bg-sage/15 hover:bg-sage/25 text-slate-text border border-sage/10"
                        }`}
                      >
                        {companionActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>{companionActive ? "Hentikan" : "Mulai Fokus"}</span>
                      </button>

                      {/* TTS Coach Speech Advice */}
                      <button
                        onClick={() => generateCoachSpeech(mission.steps[mission.currentStepIndex].instruction)}
                        disabled={loading || ttsPlaying}
                        className={`py-3 px-4 rounded-xl text-xs font-semibold bg-sage/20 text-slate-text hover:bg-sage/30 flex items-center justify-center space-x-1.5 transition-colors transition-all ${
                          ttsPlaying ? "animate-pulse font-bold" : ""
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{ttsPlaying ? "Berbicara..." : "Dikte Suara Coach"}</span>
                      </button>

                    </div>

                    {/* Small psychoeducation reminder tagline */}
                    <p className="text-[10px] text-slate-text/50 leading-relaxed text-center mt-4">
                      Body Doubling adalah teknik klinis terbukti untuk ADHD: pengerjaan tugas terasa lebih mudah saat didampingi suara/kehadiran lainnya.
                    </p>

                  </div>

                </div>
              )}

              </div>

            </motion.div>
          )}

          {/* Screen 4: Visual Emotion Mind & Psychoeducation Insight Garden */}
          {currentScreen === "insights" && (
            <motion.div
              key="insights-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="w-full flex flex-col"
            >
              {/* Escape block back to main */}
              <button 
                onClick={() => { setCurrentScreen("welcome"); playCozySynthBell(220, 0.3); }}
                className="self-start mb-6 flex items-center space-x-2 text-xs font-medium text-slate-text/60 hover:text-slate-text transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Gerbang Utama</span>
              </button>

              <div className="mb-6">
                <span className="text-xs uppercase tracking-widest text-sage font-bold font-mono">Taman Wawasan Medik</span>
                <h2 className="text-3xl font-serif font-black tracking-tight text-slate-text mt-1">
                  SatuSatu Zen Psychoeducation
                </h2>
                <p className="text-xs text-slate-text/70 mt-1 leading-relaxed">
                  Kenali mengapa kepalamu kadang buntu, dan bagaimana antarmuka SatuSatu didesain secara klinis untuk melindungimu.
                </p>
              </div>

              {/* Slider Deck */}
              <div className="bg-cream p-5 md:p-8 rounded-2xl md:rounded-3xl border border-sage/20 shadow-sm relative overflow-hidden min-h-[280px] md:min-h-[300px] flex flex-col justify-between">
                
                <div className="absolute top-0 right-0 w-24 h-24 bg-sage/5 rounded-bl-[100px]"></div>

                {/* Slider Slide block */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentInsightSlide}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 flex flex-col justify-center"
                  >
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-sage bg-sage/10 px-2.5 py-1 rounded-full border border-sage/10 self-start mb-3 md:mb-4">
                      {insights[currentInsightSlide].concept}
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-black text-slate-text mb-1 md:mb-2 leading-tight">
                      {insights[currentInsightSlide].title}
                    </h3>
                    <p className="text-[11px] md:text-xs text-slate-text/60 italic font-mono mb-3 md:mb-4">
                      {insights[currentInsightSlide].subtitle}
                    </p>
                    <p className="text-xs text-slate-text/80 leading-relaxed mb-4 md:mb-6 font-sans">
                      {insights[currentInsightSlide].desc}
                    </p>
                    <div className="p-3 bg-sage/5 rounded-xl border border-sage/10 text-xs text-slate-text text-medium font-sans flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-sage flex-shrink-0" />
                      <span>{insights[currentInsightSlide].bullet}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Slider paginated controls */}
                <div className="flex items-center justify-between border-t border-sage/10 mt-5 md:mt-6 pt-4">
                  <div className="flex space-x-1.5">
                    {insights.map((_, i) => (
                      <div 
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          currentInsightSlide === i ? "w-6 bg-sage" : "w-1.5 bg-sage/30"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        playCozySynthBell(330, 0.3);
                        setCurrentInsightSlide(curr => (curr - 1 + insights.length) % insights.length);
                      }}
                      className="p-1.5 rounded-full hover:bg-sage/10 text-slate-text/70 hover:text-slate-text border border-sage/15 transition-all text-xs flex items-center space-x-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        playCozySynthBell(392, 0.3);
                        setCurrentInsightSlide(curr => (curr + 1) % insights.length);
                      }}
                      className="p-1.5 rounded-full hover:bg-sage/10 text-slate-text/70 hover:text-slate-text border border-sage/15 transition-all text-xs flex items-center space-x-1"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Extra Zen Action Card button */}
              <div className="mt-6 p-4 rounded-2xl md:rounded-3xl bg-sage/10 border border-sage/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div>
                  <span className="font-serif font-black text-sm block">Siap Melawan Paralisis Sekarang?</span>
                  <p className="text-[10px] text-slate-text/70 mt-0.5">Letakkan kecemasanmu kepada dekompresor SatuSatu.</p>
                </div>
                <button
                  onClick={() => {
                    playCozySynthBell(440, 0.4);
                    setCurrentScreen("hub");
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 bg-sage text-cream rounded-full text-xs font-bold transition-all shadow-sm shadow-sage/15 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dekompresi Sekarang</span>
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer Branding Area */}
      {currentScreen !== "anchor" && currentScreen !== "isolation" && (
        <footer className="border-t border-sage/15 py-8 px-6 text-center text-[10px] uppercase tracking-wider text-slate-text/50 font-mono mt-auto relative z-10 bg-cream/70 backdrop-blur-md">
          <p>&copy; {new Date().getFullYear()} SatuSatu - Finding Clarity in Chaos via Multimodal AI</p>
          <p className="mt-1 font-sans font-light normal-case text-slate-text/40">Didesain khusus untuk penderita ADHD, Autisme, Prokrastinasi Kronis, dan gangguan fungsi eksekutif.</p>
        </footer>
      )}

    </div>
  );
}
