
import PreferenceForm from './components/PreferenceForm';
import MatchesList from './components/MatchesList';
import './index.css';

export default function App() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🎬 Kino Alert</h1>
        <div className="flex items-center gap-2">
          <a className="px-3 py-2 rounded-xl border" href="https://www.themoviedb.org/" target="_blank">TMDb</a>
        </div>
      </header>

      <PreferenceForm />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Dopasowania</h2>
        <MatchesList />
      </section>
    </div>
  );
}
