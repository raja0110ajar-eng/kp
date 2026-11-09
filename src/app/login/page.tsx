import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Cegah open redirect: hanya path internal yang boleh.
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';

  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <LoginForm next={safeNext} />
    </main>
  );
}