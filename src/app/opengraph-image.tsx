import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { siteConfig } from '@/config/site';

export const alt = siteConfig.tagline;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo.png'), 'base64');
  const logoSrc = `data:image/png;base64,${logo}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          background: '#123454',
          color: '#ffffff',
          padding: 80,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 60 }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#f3b49c' }}>
            {siteConfig.name}
          </div>
          <div style={{ display: 'flex', fontSize: 66, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
            {siteConfig.heroHeadline}
          </div>
          <div style={{ display: 'flex', fontSize: 30, marginTop: 36, color: '#c4ccd4' }}>
            {`${siteConfig.school.programName} ${siteConfig.school.name}, ${siteConfig.school.city}`}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={300} alt="" style={{ borderRadius: 66 }} />
      </div>
    ),
    { ...size }
  );
}