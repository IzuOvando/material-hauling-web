import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';

interface QRData {
  placas: string;
  noeconomico: string;
  operador: string;
  turno: number;
  frente: string;
  volumen: number;
  idcamion: string;
}

export function generateQRString(qrData: QRData): string {
  const qrString = JSON.stringify(qrData);

  const svgQRCode = ReactDOMServer.renderToStaticMarkup(
    <QRCodeSVG
      value={qrString}
      size={256}
      bgColor="#ffffff"
      fgColor="#000000"
      level="Q"
    />
  );

  return svgQRCode;
}
