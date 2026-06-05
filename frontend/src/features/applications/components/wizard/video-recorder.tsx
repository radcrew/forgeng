"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@components/ui/button";
import { APPLICATION_WIZARD_COPY } from "@constants/applications";
import { uploadVideoIntro } from "../../api";

const COPY = APPLICATION_WIZARD_COPY.steps.videoIntro;
const MAX_SECONDS = 30;

type State =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "ready" }
  | { status: "recording"; timeLeft: number }
  | { status: "preview"; blob: Blob; objectUrl: string }
  | { status: "uploading"; blob: Blob; objectUrl: string }
  | { status: "done"; objectUrl: string; serverUrl: string }
  | { status: "error"; message: string; blob?: Blob; objectUrl?: string };

interface VideoRecorderProps {
  onUploaded: (url: string) => void;
}

export const VideoRecorder = ({ onUploaded }: VideoRecorderProps) => {
  const [state, setState] = useState<State>({ status: "idle" });
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>("");
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Step 1 — ask for camera/mic permission and show a live preview.
  const requestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ status: "error", message: COPY.unsupported });
      return;
    }

    setState({ status: "requesting" });

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    } catch {
      setState({ status: "error", message: COPY.permissionDenied });
      return;
    }

    streamRef.current = stream;
    mimeTypeRef.current =
      ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      ) ?? "";

    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }

    setState({ status: "ready" });
  };

  // Step 2 — user clicks "Start Recording"; camera is already on.
  const beginRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = mimeTypeRef.current;
    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : {},
    );
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      const objectUrl = URL.createObjectURL(blob);
      setState({ status: "preview", blob, objectUrl });
    };

    recorder.start(100);
    setState({ status: "recording", timeLeft: MAX_SECONDS });

    let remaining = MAX_SECONDS;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        recorder.stop();
      } else {
        setState({ status: "recording", timeLeft: remaining });
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  };

  const doUpload = async (blob: Blob, objectUrl: string) => {
    setState({ status: "uploading", blob, objectUrl });
    try {
      const { url } = await uploadVideoIntro(blob);
      setState({ status: "done", objectUrl, serverUrl: url });
      onUploaded(url);
    } catch {
      setState({ status: "error", message: COPY.errorLabel, blob, objectUrl });
    }
  };

  const rerecord = () => {
    if (
      state.status === "preview" ||
      state.status === "uploading" ||
      state.status === "done" ||
      (state.status === "error" && state.objectUrl)
    ) {
      URL.revokeObjectURL(
        (state as { objectUrl?: string }).objectUrl ?? "",
      );
    }
    if (state.status === "done") {
      onUploaded("");
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If camera stream is still alive, go back to the ready preview;
    // otherwise stop everything and return to idle.
    if (streamRef.current?.active) {
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = streamRef.current;
      }
      setState({ status: "ready" });
    } else {
      stopStream();
      setState({ status: "idle" });
    }
  };

  const isRecording = state.status === "recording";
  const showLive =
    state.status === "requesting" ||
    state.status === "ready" ||
    isRecording;
  const showPreview =
    state.status === "preview" ||
    state.status === "uploading" ||
    state.status === "done" ||
    (state.status === "error" && !!state.objectUrl);
  const previewUrl = showPreview
    ? (state as { objectUrl?: string }).objectUrl
    : undefined;

  return (
    <div className="space-y-4">
      {/* Live camera feed (ready + recording) */}
      {showLive && (
        <div className="relative overflow-hidden rounded-lg bg-black aspect-video w-full">
          <video
            ref={liveVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isRecording && (
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-white drop-shadow">
                {COPY.countdownLabel(state.timeLeft)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recorded video preview */}
      {showPreview && previewUrl && (
        <div className="relative overflow-hidden rounded-lg bg-black aspect-video w-full">
          <video
            src={previewUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
          {state.status === "uploading" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-sm font-medium text-white">
                {COPY.uploadingLabel}
              </span>
            </div>
          )}
          {state.status === "done" && (
            <div className="absolute top-3 right-3 rounded bg-green-600/90 px-2 py-1 text-xs font-medium text-white">
              {COPY.doneLabel}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {/* Controls */}
      <div className="flex gap-3">
        {/* Allow camera (first step) */}
        {(state.status === "idle" ||
          (state.status === "error" && !state.blob && !state.objectUrl)) && (
          <Button type="button" onClick={requestCamera}>
            {COPY.allowCameraLabel}
          </Button>
        )}

        {/* Waiting for permission */}
        {state.status === "requesting" && (
          <Button type="button" disabled>
            {COPY.allowCameraLabel}
          </Button>
        )}

        {/* Camera is on — user decides when to start */}
        {state.status === "ready" && (
          <Button type="button" onClick={beginRecording}>
            {COPY.recordLabel}
          </Button>
        )}

        {/* Stop recording */}
        {isRecording && (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            {COPY.stopLabel}
          </Button>
        )}

        {/* Upload */}
        {(state.status === "preview" ||
          (state.status === "error" && !!state.blob)) && (
          <Button
            type="button"
            onClick={() => {
              const blob =
                state.status === "preview"
                  ? state.blob
                  : (state as { blob?: Blob }).blob!;
              const objectUrl =
                state.status === "preview"
                  ? state.objectUrl
                  : (state as { objectUrl?: string }).objectUrl ?? "";
              void doUpload(blob, objectUrl);
            }}
          >
            {state.status === "error" ? COPY.retryUploadLabel : COPY.uploadLabel}
          </Button>
        )}

        {/* Re-record */}
        {(state.status === "preview" ||
          state.status === "done" ||
          state.status === "error") && (
          <Button type="button" variant="outline" onClick={rerecord}>
            {COPY.rerecordLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
