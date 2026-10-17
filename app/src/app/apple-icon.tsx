import { ImageResponse } from 'next/og';

// Home-screen icon for iOS: the Seyyahname tile (champagne sheen with an inner ring).
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #fff6e0 0%, #e8c07d 45%, #7c6a4c 100%)' }}>
        <div style={{ width: 66, height: 66, borderRadius: 999, border: '7px solid rgba(23,18,10,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: 'rgba(23,18,10,0.45)' }} />
        </div>
      </div>
    ),
    size,
  );
}
