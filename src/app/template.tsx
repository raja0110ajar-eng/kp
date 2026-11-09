import type { ReactNode } from 'react';

// Template di-render ulang di setiap navigasi, sehingga transisi fade antar halaman diputar ulang.
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter flex flex-1 flex-col">{children}</div>;
}