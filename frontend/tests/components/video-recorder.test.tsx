import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VideoRecorder } from "@components/common/video-recorder";

class FakeMediaRecorder {
  static isTypeSupported = () => true;
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.ondataavailable?.({ data: new Blob(["v"]) });
  }
  stop() {
    this.onstop?.();
  }
}

function makeStream(withAudio: boolean): MediaStream {
  const track = { stop: vi.fn() };
  return {
    active: true,
    getTracks: () => [track],
    getAudioTracks: () => (withAudio ? [track] : []),
  } as unknown as MediaStream;
}

const getUserMedia = vi.fn();

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  // The mic level meter is not under test; a stream with no audio skips it.
  vi.stubGlobal("navigator", {
    ...navigator,
    mediaDevices: { getUserMedia },
    permissions: undefined,
  });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  getUserMedia.mockReset();
});

const renderRecorder = () =>
  render(<VideoRecorder onUpload={vi.fn()} onUploaded={vi.fn()} />);

const click = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
  });
};

describe("VideoRecorder", () => {
  it("says no device was found instead of access denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("none", "NotFoundError"));
    renderRecorder();

    await click("Allow Camera");

    expect(screen.getByText(/No camera or microphone was found/)).toBeInTheDocument();
  });

  it("warns when the camera has no microphone", async () => {
    getUserMedia.mockResolvedValue(makeStream(false));
    renderRecorder();

    await click("Allow Camera");

    expect(screen.getByText(/your voice will not be recorded/)).toBeInTheDocument();
  });

  it("shows the live camera again after Re-record", async () => {
    const stream = makeStream(false);
    getUserMedia.mockResolvedValue(stream);
    const { container } = renderRecorder();

    await click("Allow Camera");
    await click("Start Recording");
    await click("Stop");
    await click("Re-record");

    const live = container.querySelector("video[autoplay]") as HTMLVideoElement;
    expect(live.srcObject).toBe(stream);
    expect(screen.getByRole("button", { name: "Start Recording" })).toBeInTheDocument();
  });
});
