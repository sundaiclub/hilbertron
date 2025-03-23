import { NextResponse } from 'next/server';

// Simulate proof verification with a delay
const simulateProofVerification = (lemmaId: string): Promise<boolean> => {
  // Use lemmaId to determine outcome based on its value (making use of the variable)
  const idNumber = parseInt(lemmaId.replace(/\D/g, '') || '0', 10);
  
  // Random success rate for demo purposes - slightly higher for lemmas with low numbers
  const willSucceed = Math.random() > (0.2 + (idNumber % 3) * 0.05);
  
  // Different lemmas take different amounts of time to verify (2-7 seconds)
  const verificationTime = 2000 + Math.floor(Math.random() * 5000);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(willSucceed);
    }, verificationTime);
  });
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lemmaId } = body;
    
    if (!lemmaId) {
      return NextResponse.json(
        { error: 'Missing lemma ID' },
        { status: 400 }
      );
    }
    
    // Simulate verification process
    const isVerified = await simulateProofVerification(lemmaId);
    
    // Different lemmas have different proofs when verified
    const proof = isVerified 
      ? `The proof for lemma ${lemmaId} involves applying basic axioms and transformations. ` +
        `We start by assuming the premise and applying logical deductions step by step. ` +
        `Through careful application of mathematical principles, we arrive at the conclusion.`
      : '';
    
    return NextResponse.json({
      lemmaId,
      verified: isVerified,
      proof,
      status: isVerified ? 'verified' : 'failed',
    });
  } catch (err) {
    console.error('Error verifying lemma:', err);
    return NextResponse.json(
      { error: 'Failed to verify lemma' },
      { status: 500 }
    );
  }
}
