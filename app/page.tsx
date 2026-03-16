export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <h1 className="text-4xl font-semibold text-zinc-900 dark:text-white">FWDP MSME</h1>
        <p className="mt-3 text-zinc-500 dark:text-zinc-400">Welcome to the FWDP MSME platform.</p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/login"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Sign in
          </a>
          <a
            href="/register"
            className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800"
          >
            Register
          </a>
        </div>
      </div>
    </div>
  );
}
