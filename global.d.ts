declare global {
  interface Window {
    epson: any;
    enterprises: {
      images: {
        [key: string]: {
          canvas: HTMLCanvasElement;
          context: CanvasRenderingContext2D;
        };
      };
      imagesNames: string[];
    };
  }
}

export {};
