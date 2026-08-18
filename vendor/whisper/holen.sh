#!/usr/bin/env bash
# Lädt die Whisper-Modelle für das Werkzeug „Transkription“ von Hugging Face
# (onnx-community/whisper-*). Die Modelldateien liegen nicht im Git-Repository —
# sie sind zusammen rund 1 GB groß — sondern werden hiermit lokal geholt und
# per deploy.sh auf den Webspace gespiegelt. Einmalig ausführen:  vendor/whisper/holen.sh
#
# Je Modell:  Prozessor-Weg (wasm)   → encoder_model_quantized (q8) + decoder_model_merged_q4
#             Grafikkarten-Weg (WebGPU) → encoder_model (fp32)      + decoder_model_merged_q4
# Warum so: Der q8-Decoder lässt sich mit onnxruntime-web 1.26 nicht laden (QDQ-Fehler
# „Missing required scale“), der fp16-Encoder liefert auf WebGPU Unsinn („und“), und der
# q8-Encoder läuft auf WebGPU nicht schneller als auf dem Prozessor — geprüft am 18.08.2026.
set -euo pipefail
cd "$(dirname "$0")"
for m in whisper-tiny whisper-base whisper-small; do
  mkdir -p "$m/onnx"
  for f in config.json generation_config.json preprocessor_config.json tokenizer.json tokenizer_config.json \
           onnx/encoder_model_quantized.onnx onnx/encoder_model.onnx onnx/decoder_model_merged_q4.onnx; do
    if [ ! -s "$m/$f" ]; then
      echo "→ $m/$f"
      curl -sL --fail -o "$m/$f" "https://huggingface.co/onnx-community/$m/resolve/main/$f"
    fi
  done
done
echo "✓ Modelle vollständig:"; du -sh whisper-*
