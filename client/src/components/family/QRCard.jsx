import { QRCodeCanvas } from "qrcode.react";
import Card from "../ui/Card";

export default function QRCard({ user }) {
  const payload = JSON.stringify({
    id: user?.id || "demo-user",
    name: user?.name || "Demo User",
    bloodGroup: user?.bloodGroup || "O+",
    language: user?.language || "en"
  });

  return (
    <Card className="text-center">
      <p className="mb-3 text-sm text-muted">Emergency QR Identity Card</p>
      <QRCodeCanvas value={payload} size={180} bgColor="#0A0E1A" fgColor="#00D4FF" includeMargin />
    </Card>
  );
}
