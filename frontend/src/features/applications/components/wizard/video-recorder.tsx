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
  | { status: "recording"; timeLeft: number }
  | { status: "uploading"; objectUrl: string }
  | { status: "done"; objectUrl: string; serverUrl: string }
  | { status: "error"; message: string };

interface VideoRecorderProps {
  onUploaded: (url: string) => void;
}

export const VideoRecorder = ({ onUploaded }: VideoRecorderProps) => {
  const [state, setState] = useState<State>({ status: "idle" });
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Revoke object URLs and stop streams on unmount.
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

  const uploadBlob = async (blob: Blob, objectUrl: string) => {
    setState({ status: "uploading", objectUrl });
    try {
      const { url } = await uploadVideoIntro(blob);
      setState({ status: "done", objectUrl, serverUrl: url });
      onUploaded(url);
    } catch {
      URL.revokeObjectURL(objectUrl);
      setState({ status: "error", message: COPY.errorLabel });
    }
  };

  const startRecording = async () => {
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
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }

    // Pick the best available container.
    const mimeType =
      ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((t) =>
        MediaRecorder.isTypeSupported(t),
      ) ?? "";

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stopStream();
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      const objectUrl = URL.createObjectURL(blob);
      void uploadBlob(blob, objectUrl);
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

  const rerecord = () => {
    if (state.status === "done") {
      URL.revokeObjectURL(state.objectUrl);
    }
    stopStream();
    setState({ status: "idle" });
  };

  const isRecording = state.status === "recording";
  const showLive = state.status === "requesting" || isRecording;
  const showPreview = state.status === "uploading" || state.status === "done";
  const previewUrl = showPreview
    ? (state as { objectUrl: string }).objectUrl
    : undefined;

  return (
    <div className="space-y-4">
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

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex gap-3">
        {(state.status === "idle" || state.status === "error") && (
          <Button type="button" onClick={startRecording}>
            {COPY.recordLabel}
          </Button>
        )}
        {state.status === "requesting" && (
          <Button type="button" disabled>
            {COPY.recordLabel}
          </Button>
        )}
        {isRecording && (
          <Button type="button" variant="destructive" onClick={stopRecording}>
            {COPY.stopLabel}
          </Button>
        )}
        {(state.status === "done" || state.status === "error") && (
          <Button type="button" variant="outline" onClick={rerecord}>
            {COPY.rerecordLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
