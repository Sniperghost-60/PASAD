import React from 'react';
import { Link, Route, Routes } from 'react-router-dom';

function Home() {
    return (
        <section className="space-y-3">
            <h1 className="text-3xl font-bold">Laravel + React SPA</h1>
            <p className="text-slate-700">
                Cette application est configuree en Single Page Application avec React Router.
            </p>
        </section>
    );
}

function About() {
    return (
        <section className="space-y-3">
            <h1 className="text-3xl font-bold">A propos</h1>
            <p className="text-slate-700">
                Le backend reste sur Laravel, et la base de donnees cible est PostgreSQL.
            </p>
        </section>
    );
}

export default function App() {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            <div className="mx-auto max-w-4xl p-6">
                <nav className="mb-8 flex gap-4">
                    <Link className="rounded bg-slate-900 px-4 py-2 text-white" to="/">
                        Accueil
                    </Link>
                    <Link className="rounded border border-slate-400 px-4 py-2" to="/about">
                        A propos
                    </Link>
                </nav>

                <main className="rounded-lg bg-white p-6 shadow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
