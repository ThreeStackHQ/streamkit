import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">StreamKit</h1>
      <p className="text-gray-400 mb-8">Real-time event streaming for your apps</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-2 bg-brand-accent text-black font-medium rounded-lg hover:opacity-90 transition"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-6 py-2 border border-brand-accent text-brand-accent font-medium rounded-lg hover:bg-brand-accent/10 transition"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
