
import { useEffect, useState } from 'react';
import { getPrefs, savePrefs } from '../lib/api';

export default function PreferenceForm() {
  const [prefs, setPrefs] = useState<any>({ min_imdb: 7.0, genres: [], people: [], alerts_enabled: true });
  const [genres, setGenres] = useState<string>('Action,Drama,Comedy,Thriller,Sci-Fi,Fantasy,Romance,Animation,Crime,Documentary');

  useEffect(() => { getPrefs().then(setPrefs); }, []);

  function submit(e: any) {
    e.preventDefault();
    savePrefs(prefs).then(() => alert('Zapisano ✅'));
  }

  const genreOptions = genres.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <form onSubmit={submit} className="space-y-3 bg-white rounded-2xl shadow p-4">
      <div className="font-semibold text-lg">Preferencje</div>
      <label className="block">
        <span className="text-sm">Minimalna ocena (IMDb/TMDb)</span>
        <input type="number" step="0.1" min="0" max="10" value={prefs.min_imdb}
          onChange={e => setPrefs((p:any)=>({ ...p, min_imdb: parseFloat(e.target.value) }))}
          className="mt-1 w-full border rounded px-3 py-2"/>
      </label>
      <label className="block">
        <span className="text-sm">Ulubione gatunki</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {genreOptions.map(g => (
            <button key={g} type="button"
              onClick={()=> setPrefs((p:any)=>({ ...p, genres: p.genres?.includes(g) ? p.genres.filter((x:string)=>x!==g) : [...(p.genres||[]), g] }))}
              className={"px-3 py-1 rounded-full border " + (prefs.genres?.includes(g) ? "bg-black text-white" : "bg-white")}>{g}</button>
          ))}
        </div>
      </label>
      <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white">Zapisz</button>
    </form>
  );
}
