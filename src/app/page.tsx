'use client';

import { useState } from 'react';
import ProofTree from './components/ProofTree';

// Assumption sets available for theorem proving
const ASSUMPTION_SETS = [
  { id: 'basic', name: 'Basic Assumptions' },
  { id: 'algebra', name: 'Algebra' },
  { id: 'hs-math', name: 'High School Math' },
  { id: 'calculus-101', name: 'Calculus 1.0.1' },
  { id: 'advanced', name: 'Advanced Mathematics' },
];

export default function Home() {
  const [theorem, setTheorem] = useState('');
  const [selectedAssumption, setSelectedAssumption] = useState('basic');
  const [proofTree, setProofTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!theorem.trim()) {
      setError('Please enter a theorem to prove');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call API to generate proof tree
      const response = await fetch('/api/generate-proof-tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theorem,
          assumptions: selectedAssumption,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate proof tree');
      }
      
      const data = await response.json();
      setProofTree(data);
    } catch (err) {
      setError('An error occurred while generating the proof tree');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="py-6 px-4 border-b border-muted flex justify-center items-center">
        <div className="container max-w-5xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="math-symbol text-3xl font-bold text-accent">∀</span>
            <h1 className="text-2xl font-bold">Hilbertron</h1>
          </div>
          <div className="text-sm text-secondary italic">
            Automated Theorem Proving
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto py-8 px-4 flex-1">
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <span className="math-symbol mr-2">⊢</span> 
            Theorem Prover
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            <div>
              <label htmlFor="theorem" className="block text-sm font-medium mb-2">
                Enter Theorem to Prove
              </label>
              <textarea 
                id="theorem"
                value={theorem}
                onChange={(e) => setTheorem(e.target.value)}
                placeholder="e.g., For all triangles, the sum of interior angles equals 180 degrees"
                className="w-full p-3 border border-muted rounded-md bg-background"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="assumptions" className="block text-sm font-medium mb-2">
                Select Assumption Set
              </label>
              <select
                id="assumptions"
                value={selectedAssumption}
                onChange={(e) => setSelectedAssumption(e.target.value)}
                className="w-full p-3 border border-muted rounded-md bg-background"
              >
                {ASSUMPTION_SETS.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-3 bg-accent text-white rounded-md font-medium hover:bg-opacity-90 transition-colors disabled:opacity-70"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="loading-animation"></div>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="math-symbol">⊢</span> 
                    Prove Theorem
                  </span>
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
          </form>
        </section>
        
        {proofTree && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center">
              <span className="math-symbol mr-2">⊦</span> 
              Proof Tree
            </h2>
            <ProofTree tree={proofTree} />
          </section>
        )}
      </main>
      
      <footer className="py-4 px-4 border-t border-muted text-center text-sm text-secondary">
        <div className="container max-w-5xl mx-auto">
          <p>Hilbertron - Automated Theorem Proving System</p>
          <p className="mt-2">
            <span>Launched at </span>
            <a 
              href="https://sundai.club" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Sundai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
