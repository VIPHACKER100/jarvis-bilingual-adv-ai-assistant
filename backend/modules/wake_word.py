import os
import time
import numpy as np
import pyaudio
import openwakeword
from openwakeword.model import Model
from typing import Callable, Optional
import threading

from utils.logger import logger

class WakeWordEngine:
    """
    Local Wake-Word Detection Engine using OpenWakeWord.
    Runs in a background thread and triggers a callback upon detection.
    """
    def __init__(self, model_name: str = "hey_jarvis", inference_framework: str = "onnx"):
        self.model_name = model_name
        self.inference_framework = inference_framework
        self.model: Optional[Model] = None
        self.is_running = False
        self._thread: Optional[threading.Thread] = None
        self.callback: Optional[Callable] = None
        
        # Audio parameters
        self.CHUNK_SIZE = 1280  # Required by openWakeWord
        self.FORMAT = pyaudio.paInt16
        self.CHANNELS = 1
        self.RATE = 16000
        
        self._audio: Optional[pyaudio.PyAudio] = None
        self._stream: Optional[pyaudio.Stream] = None

    def initialize(self):
        """Load the model and prepare the audio stream"""
        try:
            logger.info(f"Initializing Wake-Word Engine ({self.model_name})...")
            self.model = Model(
                wakeword_models=[self.model_name],
                inference_framework=self.inference_framework
            )
            self._audio = pyaudio.PyAudio()
            logger.info("Wake-Word Engine initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Wake-Word Engine: {e}")
            raise

    def start(self, callback: Callable):
        """Start listening for the wake word"""
        if self.is_running:
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
            self._stream.stop_stream()
            self._stream.close()
        
        if self._audio:
            self._audio.terminate()
            
        logger.info("Wake-Word Detection stopped.")

    def _run(self):
        """Background listening loop"""
        try:
            self._stream = self._audio.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.RATE,
                input=True,
                frames_per_buffer=self.CHUNK_SIZE
            )
            
            logger.debug("Microphone stream opened.")
            
            while self.is_running:
                # Read audio data
                data = self._stream.read(self.CHUNK_SIZE, exception_on_overflow=False)
                if not data:
                    continue
                
                # Convert to numpy array
                audio_frame = np.frombuffer(data, dtype=np.int16)
                
                # Predict
                prediction = self.model.predict(audio_frame)
                
                # Check detection
                for model_name, score in prediction.items():
                    if score >= 0.5:  # Confidence threshold
                        logger.info(f"WAKE WORD DETECTED: {model_name} (Score: {score:.2f})")
                        if self.callback:
                            self.callback(model_name, score)
                            # Add a short cooldown to avoid double detection
                            time.sleep(1.5)
                            
        except Exception as e:
            logger.error(f"Error in Wake-Word loop: {e}")
            self.is_running = False

# Singleton instance for background monitoring
wake_word_engine = WakeWordEngine()
