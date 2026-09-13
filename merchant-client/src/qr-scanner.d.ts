declare module "qr-scanner" {
  type ScanResult = { data: string };
  type ScanCallback = (result: ScanResult | string) => void;
  type QrScannerOptions = { returnDetailedScanResult?: boolean };

  export default class QrScanner {
    static WORKER_PATH: string;
    constructor(video: HTMLVideoElement, onDecode: ScanCallback, options?: QrScannerOptions);
    start(): Promise<void>;
    stop(): void;
    destroy(): void;
  }
}
