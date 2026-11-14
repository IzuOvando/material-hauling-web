declare global {
  interface Window {
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
