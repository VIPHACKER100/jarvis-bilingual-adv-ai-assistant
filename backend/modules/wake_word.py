import os
import time
import numpy as np
import openwakeword
from openwakeword.model import Model
from typing import Callable, Optional
import threading

from utils.logger_structured import logger
from config import WAKE_WORD_THRESHOLD, WAKE_WORD_MODEL


class WakeWordEngine:
    """
    Local Wake-Word Detection Engine using OpenWakeWord (v2).
    Runs in a background thread and triggers a callback upon detection.
    Features: noise gate, dynamic cooldown, configurable threshold.
    """
    def __init__(self, model_name: str = "hey_jarvis", inference_framework: str = "onnx"):
        self.model_name = model_name
        self.inference_framework = inference_framework
        self.model: Optional[Model] = None
        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self.callback: Optional[Callable] = None
        
        # Audio parameters
        self.CHUNK_SIZE = 1280
        self.FORMAT = None
        self.CHANNELS = 1
        self.RATE = 16000
        
        self._audio = None
        self._stream = None
        self._pyaudio_available = False

    def initialize(self):
        """Load the model and prepare the audio stream, with graceful fallback"""
        try:
            import pyaudio
            self._pyaudio_available = True
        except ImportError:
            logger.warning("pyaudio not installed — wake word engine disabled")
            return

        try:
            logger.info(f"Initializing Wake-Word Engine ({self.model_name})...")
            self.model = Model(
                wakeword_models=[self.model_name],
                inference_framework=self.inference_framework
            )
            self.FORMAT = pyaudio.paInt16
            self._audio = pyaudio.PyAudio()
            logger.info("Wake-Word Engine initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Wake-Word Engine: {e}")
            raise

    def start(self, callback: Callable):
        """Start listening for the wake word"""
        if self.is_running or not self._pyaudio_available:
            return
        
        self.callback = callback
        self.is_running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        logger.info("Wake-Word Detection started.")

    def stop(self):
        """Stop listening"""
        self.is_running = False
        if self._thread:
            self._thread.join(timeout=2.0)
        
        if self._stream:
            try:
                self._stream.stop_stream()
                self._stream.close()
            except Exception:
                pass
        
        if self._audio:
            try:
                self._audio.terminate()
            except Exception:
                pass
            
        logger.info("Wake-Word Detection stopped.")

    def _noise_gate(self, audio_frame: np.ndarray, threshold: float = 30.0) -> bool:
        """Simple RMS-based noise gate — returns True if signal is above threshold"""
        rms = np.sqrt(np.mean(audio_frame.astype(np.float32) ** 2))
        return rms > threshold

    def _dynamic_cooldown(self, score: float) -> float:
        """Higher confidence = shorter cooldown (0.5–2.0s)"""
        if score > 0.8:
            return 0.5
        elif score > 0.65:
            return 1.0
        return 2.0

    def _run(self):
        """Background listening loop with noise gate and dynamic cooldown"""
        threshold = WAKE_WORD_THRESHOLD
        try:
            if not self._audio:
                return

            self._stream = self._audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK_SIZE
            )
            
            logger.debug("Microphone stream opened.")
            consecutive_silence = 0

            while self.is_running:
                try:
                    data = self._stream.read(self.CHUNK_SIZE, exception_on_overflow=False)
                except Exception:
                    self._recover_stream()
                    continue

                if not data or len(data) < self.CHUNK_SIZE:
                    continue
                
                audio_frame = np.frombuffer(data, dtype=np.int16)
                
                # Noise gate
                if not self._noise_gate(audio_frame):
                    consecutive_silence += 1
                    continue
                consecutive_silence = 0
                
                prediction = self.model.predict(audio_frame)
                
                for model_name, score in prediction.items():
                    if score >= threshold:
                        logger.info(f"WAKE WORD DETECTED: {model_name} (Score: {score:.2f})")
                        if self.callback:
                            self.callback(model_name, score)
                            time.sleep(self._dynamic_cooldown(score))
                            
        except Exception as e:
            logger.error(f"Error in Wake-Word loop: {e}")
            self.is_running = False

    def _recover_stream(self):
        """Attempt to reopen microphone stream after failure"""
        try:
            if self._stream:
                self._stream.close()
        except Exception:
            pass
        self._stream = None
        try:
            self._stream = self._audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK_SIZE
            )
        except Exception:
            pass


wake_word_engine = WakeWordEngine(model_name=WAKE_WORD_MODEL)
