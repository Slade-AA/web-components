import { ISharedBuffers, STATE } from "./state";

export class AudioHelper {
  static connect(audioElement: HTMLAudioElement, canvas: HTMLCanvasElement) {
    const context = new OfflineAudioContext({
      numberOfChannels: 1,
      length: 5 * 22050,
      sampleRate: 22050,
    });

    // I usually find that AudioContext is much easier to debug than an OfflineAudioContext
    // const context = new AudioContext({
    //   sampleRate: 22050,
    // });

    let source: any;

    // TODO: see if there is a better way to do this
    // TODO: probably use web codec (AudioDecoder) for decoding partial files
    fetch(audioElement.src)
      .then((response) => response.arrayBuffer())
      .then((downloadedBuffer) => context.decodeAudioData(downloadedBuffer))
      .then((decodedBuffer) => {
        source = new AudioBufferSourceNode(context, { buffer: decodedBuffer });
      })
      .then(() => context.audioWorklet.addModule("src/components/helpers/audio/buffer-builder-processor.ts"))
      .then(() => {
        const bufferProcessorNode = new AudioWorkletNode(context, "buffer-builder-processor");
        const bufferKernelWorker = new Worker("src/components/helpers/audio/worker.ts", {
          type: "module",
        });

        const fullBufferLength = 4;
        const offscreenCanvas = canvas.transferControlToOffscreen();

        const sharedBuffers: ISharedBuffers = {
          states: new SharedArrayBuffer(1024),
          buffer: new SharedArrayBuffer(512 * fullBufferLength),
        };

        new Float32Array(sharedBuffers.buffer).fill(0);
        new Float32Array(sharedBuffers.states).fill(0);

        new Int32Array(sharedBuffers.states)[STATE.FULL_BUFFER_LENGTH] = fullBufferLength;

        bufferKernelWorker.postMessage({ ...sharedBuffers, canvas: offscreenCanvas }, [offscreenCanvas]);
        bufferProcessorNode.port.postMessage(sharedBuffers);

        source.connect(bufferProcessorNode).connect(context.destination);

        context.addEventListener("complete", () => {
          new Int32Array(sharedBuffers.states)[STATE.FINISHED_PROCESSING] = 1;
        });

        bufferProcessorNode.port.onmessage = (event: MessageEvent) => {
          if (event.data === "ready") {
            source.start();
            context.startRendering();
          }
        };
      });
  }
}
