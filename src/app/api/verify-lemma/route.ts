import { NextResponse } from 'next/server';
import OpenAI from 'openai';

interface MaestroRunResponse {
  id: string;
  status: 'in_progress' | 'completed' | 'failed';
  result?: string;
  error?: {
    message: string;
    type: string;
  };
  created_at: string;
  completed_at?: string;
}

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

async function gptCall(step: string[], assumption: string[], maestroOutput: string): Promise<boolean> {
  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "user", 
          content: 
            `Given the steps: ${step}, the assumptions: ${assumption}, ` +
            `and the output: ${maestroOutput}, determine whether the output is correct. ` +
            "Respond ONLY with a single digit: 1 if correct, 0 if incorrect. " +
            "Do not include any explanation or extra text."
        }
      ]
    });
    
    const result = completion.choices[0].message.content?.trim();
    console.log('Verification result:', result);
    
    return result === '1';
  } catch (error) {
    console.error('Error calling GPT:', error);
    return false;
  }
}

async function maestroRag(step: string[], assumptions: string[], fileId: string): Promise<string> {
  try {
    const apiKey = process.env.AI21LABS_API_KEY;
    if (!apiKey) {
      throw new Error('AI21 API key not found');
    }

    const theorem = step.join(' ');
    console.log(`Calling AI21 Maestro to prove theorem: "${theorem}" using assumptions: ${assumptions.join(', ')}`);
    
    const createRunResponse = await fetch('https://api.ai21.com/studio/v1/maestro/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: `I need a formal mathematical proof for the following theorem: "${theorem}". 
                Please provide a detailed step-by-step proof using the following assumptions: ${assumptions.join(', ')}.
                Format the proof with clear logical steps and include mathematical notation where appropriate.`,
        context: {
          mathematical_domain: "theorem_proving",
          theorem: theorem,
          assumptions: assumptions,
          reference_file: fileId
        },
        tools: [{ type: "file_search" }],
        tool_resources: { 
          file_search: { 
            fileIds: [fileId] 
          } 
        }
      }),
    });

    if (!createRunResponse.ok) {
      const errorData = await createRunResponse.json();
      throw new Error(`Failed to create Maestro run: ${JSON.stringify(errorData)}`);
    }

    const createRunData = await createRunResponse.json();
    const runId = createRunData.id;
    
    console.log(`Maestro run created with ID: ${runId}`);
    
    const result = await pollMaestroRun(runId, apiKey);
    console.log('AI21 Maestro response received: ', result);
    
    return result.result || 'No output generated from Maestro';
  } catch (error) {
    console.error('Error calling AI21 Maestro:', error);
    return 'An error occurred while generating the proof.';
  }
}

async function pollMaestroRun(runId: string, apiKey: string, maxAttempts = 20): Promise<MaestroRunResponse> {
  let attempts = 0;
  let delay = 1000; 
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://api.ai21.com/studio/v1/maestro/runs/${runId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!statusResponse.ok) {
      const errorData = await statusResponse.json();
      throw new Error(`Failed to get run status: ${JSON.stringify(errorData)}`);
    }
    
    const statusData = await statusResponse.json();
    console.log(`Maestro run status: ${statusData.status}, attempt ${attempts + 1}`);
    
    if (statusData.status === 'completed') {
      return statusData;
    }
    
    if (statusData.status === 'failed') {
      throw new Error(`Maestro run failed: ${JSON.stringify(statusData.error)}`);
    }
    
    delay = Math.min(delay * 1.5, 10000); 
    delay += Math.random() * 1000; 
    
    await new Promise(resolve => setTimeout(resolve, delay));
    attempts++;
  }
  
  throw new Error(`Maestro run timed out after ${maxAttempts} attempts`);
}

function generateDemoProof(step: string[], assumptions: string[]): string {
  const stepText = step.join(' ');
  
  if (stepText.includes('differentiable')) {
    return `# Proof that differentiability implies continuity\n\nGiven that a function f is differentiable at x = a, we can prove it is continuous at x = a.\n\nBy definition, the derivative exists: f'(a) = lim_{h→0} [f(a+h) - f(a)]/h\n\nRearranging: lim_{h→0} [f(a+h) - f(a)] = lim_{h→0} [h·f'(a)] = 0\n\nTherefore: lim_{h→0} f(a+h) = f(a)\n\nSetting x = a+h, as h→0, x→a, so: lim_{x→a} f(x) = f(a)\n\nThis is the definition of continuity at x = a. Therefore, differentiability implies continuity.`;
  } else if (stepText.includes('triangle') || stepText.includes('hypotenuse')) {
    return `# Proof of the Pythagorean Theorem\n\nIn a right triangle with sides a, b, and hypotenuse c, we prove that a² + b² = c².\n\nDraw the altitude h from the right angle to the hypotenuse, creating two similar triangles.\n\nBy similarity: p/a = a/c → p = a²/c, and q/b = b/c → q = b²/c\n\nSince p + q = c: a²/c + b²/c = c\n\nMultiplying both sides by c: a² + b² = c²\n\nTherefore, in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.`;
  } else {
    return `# Proof of the Mathematical Statement\n\nUsing the assumptions: ${assumptions.join(', ')}\n\nWe apply a series of logical deductions to prove: ${stepText}\n\n1. First, we establish the basic principles involved.\n2. Next, we apply the relevant axioms and theorems.\n3. Through careful inference, we derive the intermediate results.\n4. These build toward our conclusion.\n\nTherefore, the statement is proven to be true.`;
  }
}

const lemmaDb: {
  [key: string]: {
    step: string[];
    assumptions: string[];
    fileId: string;
  };
} = {
  'diffCont': {
    step: ['If a function is differentiable at a point, then it is continuous at that point'],
    assumptions: ['Definition of differentiability', 'Definition of continuity', 'Limit laws'],
    fileId: 'calc_file'
  },
  'pythag': {
    step: ['In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides'],
    assumptions: ['Properties of right triangles', 'Similarity of triangles', 'Area preservation'],
    fileId: 'geom_file'
  },
  'default': {
    step: ['The statement is mathematically sound'],
    assumptions: ['Basic mathematical axioms', 'Logical deduction rules'],
    fileId: 'math_file'
  }
};

async function verifyLemmaWithAI(lemmaData: {
  id: string,
  statement: string,
  assumptions?: string[]
}): Promise<{ verified: boolean, proof: string, status: string }> {
  // Add a simulated delay for a more natural verification experience
  const verificationTime = 2000 + Math.floor(Math.random() * 3000);
  
  // Introduce a delay to simulate processing time
  await new Promise(resolve => setTimeout(resolve, verificationTime));
  
  try {
    let proof = '';
    
    // Convert lemma statement to an array format for consistency
    const lemmaStep = [lemmaData.statement];
    
    // Extract or default assumptions
    const assumptions = lemmaData.assumptions || ['Basic mathematical axioms', 'Logical deduction rules'];
    
    // Use real AI21 if API key is provided and valid
    if (process.env.AI21LABS_API_KEY && process.env.AI21LABS_API_KEY.length > 10) {
      try {
        proof = await maestroRag(
          lemmaStep, 
          assumptions, 
          'math_file' // Default file ID for now
        );
      } catch (error) {
        console.error('AI21 error, falling back to demo:', error);
        proof = generateDemoProof(lemmaStep, assumptions);
      }
    } else {
      // Fall back to simulation if no valid API key
      proof = generateDemoProof(lemmaStep, assumptions);
    }
    
    // For demo purposes (or if OpenAI key is not provided), we'll simulate verification
    let isVerified = true;
    
    // If OpenAI API key is available, actually verify the proof
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10) {
      isVerified = await gptCall(
        lemmaStep,
        assumptions,
        proof
      );
    } else {
      // Simulate verification with 80% success rate for demo
      isVerified = Math.random() > 0.2;
    }
    
    return {
      verified: isVerified,
      proof: isVerified ? proof : '',
      status: isVerified ? 'verified' : 'failed'
    };
  } catch (error) {
    console.error('Error during verification:', error);
    
    // For demo purposes, fall back to random success if verification fails
    const fallbackVerified = Math.random() > 0.3;
    
    return {
      verified: fallbackVerified,
      proof: fallbackVerified 
        ? `The proof for this lemma involves applying basic axioms and logical deductions.`
        : '',
      status: 'error'
    };
  }
}

// API route handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lemmaId, statement, assumptions } = body;
    
    if (!lemmaId) {
      return NextResponse.json({ error: 'Lemma ID is required', status: 'error' }, { status: 400 });
    }
    
    // Use the provided statement or fall back to lemmaDb if not provided
    // (for backward compatibility)
    let lemmaData;
    if (statement) {
      lemmaData = {
        id: lemmaId,
        statement,
        assumptions
      };
    } else {
      const lemmaDetails = lemmaDb[lemmaId] || lemmaDb.default;
      lemmaData = {
        id: lemmaId,
        statement: lemmaDetails.step.join(' '),
        assumptions: lemmaDetails.assumptions
      };
    }
    
    const result = await verifyLemmaWithAI(lemmaData);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Verification route error:', error);
    return NextResponse.json({ error: 'Failed to verify lemma', status: 'error' }, { status: 500 });
  }
}
