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

    const getImagesInfo: () => Promise<{
      directory: string;
      images: string[];
    }> = async () => {
      try {
        const res = await fetch("/api/enterprises/images", { method: "GET" });
        return res.json();
      } catch (error) {
        return {
          directory: "",
          images: [],
        };
      }
    };

    const preloadEnterprisesImages = async () => {
      const { directory, images } = await getImagesInfo();

      window.enterprises = {
        images: {},
        imagesNames: [],
      };

      for (const imageName of images) {
        loadImage(`${directory}/${imageName}`).then((img) => {
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
            window.enterprises.imagesNames.push(imageNameWithoutExtension);
          }
        });
      }
    };

    preloadEnterprisesImages();
  }, []);

  return null;
};

export default EnterprisesImagesInitializer;
