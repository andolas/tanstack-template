type Props = {
  input: string
  setInput: (value: string) => void
  handleSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function WelcomeScreen({ input, setInput, handleSubmit, isLoading }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 text-white text-center">
      <h1 className="text-4xl font-bold mb-4">Analizza la tua idea di business</h1>
      <p className="text-lg text-gray-300 mb-8 max-w-xl">
        Inserisci la tua idea qui sotto. Riceverai una SWOT analysis personalizzata direttamente via email.
      </p>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl flex flex-col gap-4 items-center"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={5}
          placeholder="Descrivi la tua idea di business..."
          className="w-full p-4 rounded-md text-black border border-gray-300"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="La tua email"
          className="w-full p-4 rounded-md text-black border border-gray-300"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-lg font-medium"
        >
          {isLoading ? "Invio in corso..." : "Ricevi SWOT"}
        </button>
      </form>
    </div>
  )
}
export const Route = createFileRoute('/')({
  component: WelcomeScreen,
})
