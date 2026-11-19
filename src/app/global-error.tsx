"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-svh max-w-lg flex-col items-start justify-center gap-4 p-6">
          <h1 className="text-2xl font-bold">Could not load the world</h1>
          <p>Check that the SQLite database is available, then try again. For a new installation, run the database setup before starting Simplayz.</p>
          <button className="rounded-full bg-ink px-4 py-2 font-semibold text-paper" type="button" onClick={reset}>Try again</button>
        </main>
      </body>
    </html>
  );
}
