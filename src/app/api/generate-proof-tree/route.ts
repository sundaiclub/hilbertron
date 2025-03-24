import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Define proper interface for the proof tree structure
interface Lemma {
  id: string;
  statement: string;
  status: string;
  proof?: string;
  lemmas?: Lemma[];
}

interface ProofTree {
  theorem: string;
  status: string;
  lemmas: Lemma[];
}

// Function to generate a proof tree using OpenAI
async function generateProofTreeWithLLM(theorem: string): Promise<ProofTree | null> {
  try {
    // Define system prompt for generating a proof tree
    const systemPrompt = `You are an advanced mathematical proof assistant. 
    Your task is to break down a mathematical theorem into a structured proof tree.
    For the given theorem, create a hierarchical structure of lemmas needed to prove it.
    
    Format the response as a JSON object with the following structure:
    {
      "theorem": "The original theorem statement",
      "status": "pending",
      "lemmas": [
        {
          "id": "lemma-1",
          "statement": "First key lemma statement",
          "status": "pending",
          "lemmas": [] // Sub-lemmas if needed
        },
        // More lemmas as needed
      ]
    }
    
    For each lemma, consider what sub-lemmas might be needed to prove it, and include those in a nested "lemmas" array.
    Assign each lemma a unique ID in the format "lemma-X" or "lemma-X-Y" for nested lemmas.
    All lemmas should have status set to "pending".
    Ensure the proof follows a logical flow, breaking down complex concepts into simpler ones.`;

    // Call OpenAI API to generate the proof tree
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a proof tree for the following theorem: "${theorem}"` }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const proofTree = JSON.parse(responseContent);
      return proofTree;
    } catch (parseError) {
      console.error('Error parsing JSON from OpenAI response:', parseError);
      console.log('Response content:', responseContent);
      throw new Error('Failed to parse OpenAI response');
    }
  } catch (error) {
    console.error('Error generating proof tree with LLM:', error);
    return null;
  }
}

// Dummy proof tree data structure for demonstration
const dummyProofTree: ProofTree = {
  theorem: "If f is differentiable at x = a, then f is continuous at x = a",
  status: "pending",
  lemmas: [
    {
      id: "lemma-1",
      statement: "Definition of differentiability at x = a",
      status: "pending",
      proof: "A function f is differentiable at x = a if the limit as h approaches 0 of [f(a+h) - f(a)]/h exists and is finite.",
    },
    {
      id: "lemma-2",
      statement: "Definition of continuity at x = a",
      status: "pending",
      proof: "A function f is continuous at x = a if the limit as x approaches a of f(x) equals f(a).",
    },
    {
      id: "lemma-3",
      statement: "Relationship between differentiability and continuity",
      status: "pending",
      lemmas: [
        {
          id: "lemma-3-1",
          statement: "Express limit as x→a of f(x) - f(a) in terms of difference quotient",
          status: "pending",
          proof: "As x approaches a, we can set h = x - a, so x = a + h and h approaches 0. Then f(x) - f(a) = f(a+h) - f(a).",
        },
        {
          id: "lemma-3-2",
          statement: "Multiply and divide by h",
          status: "pending",
          proof: "f(x) - f(a) = f(a+h) - f(a) = h · [f(a+h) - f(a)]/h"
        }
      ]
    },
    {
      id: "lemma-4",
      statement: "Application of limit laws",
      status: "pending",
      lemmas: [
        {
          id: "lemma-4-1",
          statement: "Limit of a product is the product of limits",
          status: "pending",
          proof: "If lim(x→a) g(x) = L and lim(x→a) h(x) = M, then lim(x→a) [g(x) · h(x)] = L · M, provided both limits exist."
        },
        {
          id: "lemma-4-2",
          statement: "Limit of h as h approaches 0",
          status: "pending",
          proof: "The limit of h as h approaches 0 is 0."
        },
        {
          id: "lemma-4-3",
          statement: "Limit of the difference quotient exists by differentiability",
          status: "pending",
          proof: "Since f is differentiable at x = a, the limit of [f(a+h) - f(a)]/h as h approaches 0 exists and equals f'(a)."
        }
      ]
    },
    {
      id: "lemma-5",
      statement: "Final step of the proof",
      status: "pending",
      lemmas: [
        {
          id: "lemma-5-1",
          statement: "Apply the limit product rule",
          status: "pending",
          proof: "lim(h→0) [f(a+h) - f(a)] = lim(h→0) h · lim(h→0) [f(a+h) - f(a)]/h = 0 · f'(a) = 0",
        },
        {
          id: "lemma-5-2",
          statement: "Conclude continuity",
          status: "pending",
          proof: "lim(x→a) f(x) - f(a) = 0, which means lim(x→a) f(x) = f(a), satisfying the definition of continuity at x = a."
        }
      ]
    }
  ]
};

// Alternative proof tree for Pythagorean Theorem with multiple approaches
const pythagoreanProofTree: ProofTree = {
  theorem: "In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides (a² + b² = c²)",
  status: "pending",
  lemmas: [
    {
      id: "approach-1",
      statement: "Algebraic proof using similar triangles",
      status: "pending",
      lemmas: [
        {
          id: "approach-1-lemma-1",
          statement: "Draw altitude from right angle to hypotenuse",
          status: "pending",
          proof: "The altitude h from the right angle to the hypotenuse c creates two similar triangles."
        },
        {
          id: "approach-1-lemma-2",
          statement: "Apply properties of similar triangles",
          status: "pending",
          proof: "Due to similarity, we can write a/p = h/a and b/q = h/b, where p and q are segments of the hypotenuse."
        },
        {
          id: "approach-1-lemma-3",
          statement: "Derive the Pythagorean relation",
          status: "pending",
          proof: "From the similar triangle relations, we get a² = pc and b² = qc. Since p + q = c, we have a² + b² = pc + qc = c(p + q) = c²."
        }
      ]
    },
    {
      id: "approach-2",
      statement: "Geometric proof using area comparison",
      status: "pending",
      lemmas: [
        {
          id: "approach-2-lemma-1",
          statement: "Construct a square with side length a + b",
          status: "pending",
          proof: "Create a square with side length (a + b) and place four identical right triangles inside it, each with sides a and b."
        },
        {
          id: "approach-2-lemma-2",
          statement: "Compare areas in the construction",
          status: "pending",
          proof: "The area of the large square is (a + b)². The area of the four triangles is 4(ab/2) = 2ab. The remaining area is a square with side c."
        },
        {
          id: "approach-2-lemma-3",
          statement: "Apply area calculations",
          status: "pending",
          proof: "(a + b)² = c² + 2ab, which simplifies to a² + 2ab + b² = c² + 2ab, and finally a² + b² = c²."
        }
      ]
    },
    {
      id: "approach-3",
      statement: "Proof using coordinate geometry",
      status: "pending",
      lemmas: [
        {
          id: "approach-3-lemma-1",
          statement: "Place the right triangle in a coordinate system",
          status: "pending",
          proof: "Place the right angle at the origin, with one leg along the x-axis to (a,0) and the other along the y-axis to (0,b)."
        },
        {
          id: "approach-3-lemma-2",
          statement: "Apply the distance formula",
          status: "pending",
          proof: "The hypotenuse connects (0,0) to (a,b). Using the distance formula, c² = (a-0)² + (b-0)² = a² + b²."
        }
      ]
    }
  ]
};

// API route handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { theorem, assumptionSet } = body;

    // Log for debugging
    console.log(`Using assumption set: ${assumptionSet || 'basic'}`);

    // Use LLM to generate proof tree if theorem is provided, otherwise use dummy trees
    let proofTree: ProofTree | null;
    
    if (theorem && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10) {
      // Use OpenAI to generate a dynamic proof tree
      proofTree = await generateProofTreeWithLLM(theorem);
      
      // Fall back to dummy proof tree if LLM generation fails
      if (!proofTree) {
        proofTree = theorem.toLowerCase().includes('pythagoras') 
          ? pythagoreanProofTree 
          : dummyProofTree;
      }
    } else {
      // Use predefined proof trees if no theorem is provided or no OpenAI API key
      proofTree = (assumptionSet === 'pythagorean' || 
                  (theorem && theorem.toLowerCase().includes('pythagoras'))) 
        ? pythagoreanProofTree 
        : dummyProofTree;
    }

    return NextResponse.json(proofTree);
  } catch (error) {
    console.error('Proof tree generation error:', error);
    return NextResponse.json({ error: 'Failed to generate proof tree' }, { status: 500 });
  }
}

// Configure longer timeout for this route
export const config = {
  maxDuration: 60, // 60 seconds timeout
}
