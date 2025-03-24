# Hilbertron: Mathematical Theorem Prover!

Hilbertron: A sophisticated theorem prover that visualizes multiple proof approaches for mathematical theorems.

## Project Overview

Hilbertron is an interactive web application designed for automated theorem proving in mathematics. It provides users with structured visual proof trees that demonstrate different approaches to proving mathematical theorems.

## Key Features

- **Multiple Proof Approaches**: Demonstrates various methods to prove the same theorem (algebraic, geometric, etc.)
- **Interactive Proof Tree**: Visualizes the logical structure of proofs with expandable branches
- **Verification Simulation**: Simulates the verification process for each lemma in real-time
- **Assumption Selection**: Allows users to select different sets of mathematical assumptions

## Technical Implementation

### Frontend
- Built with **Next.js 15** and **React 19** for a responsive single-page application
- Styled using **TailwindCSS** with a serious, mathematical aesthetic
- Uses **Geist** font family for clean typography suitable for mathematical notation
- Implements dynamic component rendering with React hooks for state management

### Backend
- API routes implemented with Next.js serverless functions
- Two primary endpoints:
  - `/api/generate-proof-tree`: Creates proof structures with varying complexity
  - `/api/verify-lemma`: Simulates verification with randomized timing and results

### Proof Structure
The application models mathematical proofs as tree structures where:
- The theorem is the root node
- Supporting lemmas form branches
- Each lemma can have its own sub-lemmas
- Multiple proof approaches can be explored in parallel branches

## Use Cases
- **Educational Tool**: Helps students understand different proof methodologies
- **Research Aid**: Assists mathematicians in exploring multiple proof strategies
- **Mathematical Visualization**: Transforms abstract logical structures into visual representations

## Project Status
Hilbertron is a prototype that currently includes examples for:
- Calculus theorems (e.g., differentiability implies continuity)
- Geometric theorems (e.g., Pythagorean theorem with three proof approaches)

Launched at [Sundai Club](https://sundai.club) as an exploration of interactive mathematical tools.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build for Production

To build the application for production:

```bash
npm run build
npm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
