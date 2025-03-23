'use client';

import { useState, useEffect, useCallback } from 'react';

// Type definitions for our proof tree
type LemmaStatus = 'pending' | 'verifying' | 'verified' | 'failed';

interface Lemma {
  id: string;
  statement: string;
  status: LemmaStatus;
  proof?: string;
  lemmas?: Lemma[];
}

interface ProofTreeProps {
  tree: {
    theorem: string;
    status: LemmaStatus;
    lemmas: Lemma[];
  };
}

// ProofTree component for visualizing the theorem and its supporting lemmas
const ProofTree: React.FC<ProofTreeProps> = ({ tree }) => {
  return (
    <div className="proof-tree">
      <div className="theorem-node bg-muted p-4 rounded-md mb-6 border-l-4 border-accent">
        <h3 className="font-bold mb-2 text-lg">{tree.theorem}</h3>
        <div className="flex items-center">
          <span className="text-sm text-secondary">Status: </span>
          <StatusIndicator status={tree.status} />
        </div>
      </div>
      
      <div className="lemmas-container ml-6 border-l-2 border-muted pl-6">
        {tree.lemmas.map((lemma) => (
          <LemmaNode key={lemma.id} lemma={lemma} />
        ))}
      </div>
    </div>
  );
};

// Component for individual lemma nodes in the proof tree
const LemmaNode: React.FC<{ lemma: Lemma }> = ({ lemma }) => {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<LemmaStatus>(lemma.status);
  const [proof, setProof] = useState<string | undefined>(lemma.proof);

  // Define verifyLemma with useCallback to properly handle dependencies
  const verifyLemma = useCallback(async () => {
    try {
      setStatus('verifying');
      
      // Call the API to verify this lemma
      const response = await fetch('/api/verify-lemma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lemmaId: lemma.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify lemma');
      }
      
      const data = await response.json();
      setStatus(data.status);
      
      if (data.verified && data.proof) {
        setProof(data.proof);
      }
    } catch (error) {
      console.error('Error verifying lemma:', error);
      setStatus('failed');
    }
  }, [lemma.id]); // Add lemma.id as a dependency

  // Verify the lemma when the component mounts if it's pending
  useEffect(() => {
    // Don't start verification immediately, only if the lemma is pending
    if (status === 'pending') {
      // Use a slight delay to create a staggered verification effect
      const timer = setTimeout(() => {
        verifyLemma();
      }, 500 + Math.random() * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [status, verifyLemma]); // Added verifyLemma as a dependency

  return (
    <div className="lemma-container mb-4">
      <div 
        className="proof-tree-node p-4 bg-background rounded-md border border-muted hover:border-accent cursor-pointer flex flex-col"
        onClick={() => status === 'verified' && setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium">{lemma.statement}</p>
          </div>
          <div className="flex items-center ml-4">
            <StatusIndicator status={status} />
            {status === 'verified' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="ml-2 text-accent hover:text-opacity-80"
              >
                {expanded ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
        
        {expanded && status === 'verified' && proof && (
          <div className="mt-4 p-3 bg-muted rounded border-l-2 border-accent text-sm">
            <h4 className="font-bold mb-2">Proof:</h4>
            <p>{proof}</p>
          </div>
        )}
      </div>
      
      {lemma.lemmas && lemma.lemmas.length > 0 && (
        <div className="sub-lemmas-container ml-6 border-l-2 border-muted pl-6 mt-2">
          {lemma.lemmas.map((subLemma) => (
            <LemmaNode key={subLemma.id} lemma={subLemma} />
          ))}
        </div>
      )}
    </div>
  );
};

// Component to display the status indicator (loading, checkmark, or crossmark)
const StatusIndicator: React.FC<{ status: LemmaStatus }> = ({ status }) => {
  switch (status) {
    case 'verifying':
      return <div className="loading-animation ml-2" />;
    case 'verified':
      return <span className="checkmark ml-2">✓</span>;
    case 'failed':
      return <span className="crossmark ml-2">✗</span>;
    default:
      return <span className="text-secondary ml-2">Pending</span>;
  }
};

export default ProofTree;
