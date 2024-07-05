"use client";
import { useEffect } from "react";

const EnterprisesImagesInitializer = () => {
  useEffect(() => {
    const loadImage: (src: string) => Promise<HTMLImageElement> = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });
    };

    const preloadEnterprisesImages = () => {
      const imageDirectory = "/images/enterprises";
      const imageNames = [
        "sedena.png",
        "comercializadora_san_fernando.jpeg",
        "concremex.jpeg",
        "constructora_sunight.jpeg",
        "edificaciones_inteligentes.jpeg",
        "la_silla.jpeg",
        "mabinas.jpeg",
        "tancol.jpeg",
        "tierra_firme.jpeg",
      ];
      //TODO: Get from API images on folder
      window.enterprises = {
        images: {},
      };

      for (const imageName of imageNames) {
        loadImage(`${imageDirectory}/${imageName}`).then((img) => {
          const imageNameWithoutExtension = imageName.split(".")[0];
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (context) {
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            window.enterprises.images[imageNameWithoutExtension] = {
              context,
              canvas,
            };
          }
        });
      }
    };

    preloadEnterprisesImages();
  }, []);

  return null;
};

export default EnterprisesImagesInitializer;
