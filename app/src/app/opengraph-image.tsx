import { ImageResponse } from 'next/og';

// Shared preview card (OpenGraph and Twitter), rendered at build time in the Concept C palette.
export const alt = 'Seyyahname AI Coach: CEFR A1–C2 English coaching';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 80, background: '#0a0a0b', color: '#ededef' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'radial-gradient(circle at 30% 30%, #fff3d6, #e8c07d 45%, #8a6a35)' }} />
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>Seyyahname</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3, lineHeight: 1.05 }}>Your AI English coach, A1 to C2.</div>
          <div style={{ fontSize: 30, color: '#a1a1aa' }}>CEFR curriculum · SM-2 vocabulary · real-time streaming feedback</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((l, i) => (
            <div key={l} style={{ display: 'flex', padding: '8px 18px', borderRadius: 999, fontSize: 24, background: i === 5 ? '#e8c07d' : '#18181b', color: i === 5 ? '#0a0a0b' : '#e8c07d' }}>
              {l}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
