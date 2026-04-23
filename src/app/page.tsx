export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-8">
      <h1 className="font-serif text-5xl text-jera-mint tracking-tight">Jera Horizonte</h1>
      <p className="text-jera-off/70 text-lg">Plataforma de gestão patrimonial</p>
      <a
        href="/sign-in"
        className="px-6 py-3 rounded-lg bg-jera-teal text-jera-off font-medium hover:bg-jera-teal/80 transition-colors"
      >
        Acessar
      </a>
    </main>
  )
}
