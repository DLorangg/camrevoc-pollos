"use client";

import { QRCodeSVG } from "qrcode.react";

export default function ValeQR({ url }: { url: string }) {
  return (
    <div className="flex justify-center">
      <div className="rounded-2xl bg-white p-4 shadow-md">
        <QRCodeSVG
          value={url}
          size={180}
          level="M"
          fgColor="#1a1a1a"
          bgColor="#ffffff"
          marginSize={1}
          title="Código QR del vale"
        />
      </div>
    </div>
  );
}
