from fastapi import FastAPI, HTTPException, Body
from typing import Dict, List, Optional, Union, Literal, Any, Tuple
import json
from pydantic import BaseModel

from ai21 import AI21Client, AsyncAI21Client
from openai import OpenAI  # Changed to synchronous client for simplicity
from dotenv import load_dotenv
import os

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
ai21_api_key = os.getenv("AI21_API_KEY")

client = AI21Client(api_key=ai21_api_key)
async_client = AsyncAI21Client(api_key=ai21_api_key)

# Initialize OpenAI client with bare minimum configuration
openai_client = None  # Default to None
if openai_api_key:
    try:
        # Try with minimal configuration
        from openai import OpenAI
        openai_client = OpenAI(api_key=openai_api_key)
    except TypeError as e:
        print(f"Error initializing OpenAI client: {e}")
        # Fallback to alternative initialization if necessary
        pass

app = FastAPI(title="Minimal API Demo")

# In-memory data storage
data_store = {
    "items": []
}

# Pydantic models for the tree structure
class ProofNode(BaseModel):
    """Represents a node in the proof tree."""
    step: str  # The step description/content
    explanation: Optional[str] = None  # Optional explanation of the step
    children: List[Any] = []  # List of child nodes (max 2)
    is_leaf: bool = False  # Flag to indicate if this is a leaf node

# Allow for self-referencing in ProofNode
ProofNode.update_forward_refs()

class TheoremRequest(BaseModel):
    """Request model for theorem processing."""
    theorem: str
    model: str = "gpt-4o"  # Default to GPT-4 Turbo as it's better for math reasoning
    max_tokens: int = 1500
    temperature: float = 0.2

class TheoremResponse(BaseModel):
    """Response model for processed theorem."""
    theorem: str
    proof_tree: ProofNode

# GET routes
@app.get("/")
def read_root():
    return {"message": "Welcome to the minimal API demo"}


@app.post("/theorem-proof")
async def process_theorem(request: TheoremRequest, parse_tree: bool = False):
    """
    Process a mathematical theorem and break it down into a structured proof tree.
    Each node in the tree represents a step in the proof with at most 5 children (substeps).
    
    Args:
        request: The theorem request containing the theorem text
        parse_tree: If True, also parses the proof tree for additional analysis
    """
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    # Create system prompt that explains the task and desired output format
    system_prompt = """
    You are a mathematics expert specialized in breaking down proofs into clear, logical steps.
    
    Your task is to decompose a mathematical theorem and its proof into a hierarchical tree structure where:
    - The root node is the original theorem
    - Each node is a logical step in the proof
    - Each node can have at most 5 children, which represent substeps
    - Leaf nodes are steps that cannot be broken down further
    
    Format requirements:
    1. Structure your response as a JSON object with the following format:
    {
        "step": "[Step description]",
        "explanation": "[Optional explanation]",
        "children": [  // Max 5 children
            {
                "step": "[Substep 1]",
                "explanation": "[Optional explanation]",
                "children": [],
                "is_leaf": true/false
            },
            {
                "step": "[Substep 2]",
                "explanation": "[Optional explanation]",
                "children": [],
                "is_leaf": true/false
            }
        ],
        "is_leaf": false  // Because this node has children
    }
    
    2. Ensure the tree is logically sound - each child must be a proper substep of its parent
    3. Make each step clear, concise, and mathematically precise
    4. Only include the JSON object in your response, nothing else
    """
    
    # Create user prompt with the theorem
    user_prompt = f"Break down this mathematical theorem into a proof tree: {request.theorem}"
    
    try:
        # Call OpenAI API
        response = openai_client.chat.completions.create(
            model=request.model,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=request.max_tokens,
            temperature=request.temperature
        )
        
        # Extract and parse the JSON response
        try:
            content = response.choices[0].message.content
            proof_tree = json.loads(content)
            
            # Create the response with the theorem and proof tree
            theorem_response = {"theorem": request.theorem, "proof_tree": proof_tree}
            
            # If parse_tree=True, also parse the tree structure and include additional analysis
            if parse_tree:
                # Call the parse_theorem_tree function directly
                parsed_tree_data = await parse_theorem_tree(theorem_response)
                return {
                    "theorem": request.theorem,
                    "proof_tree": proof_tree,
                    "tree_analysis": parsed_tree_data
                }
            
            # Otherwise just return the basic response
            return theorem_response
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse OpenAI response as JSON: {str(e)}. Response content: {content}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calling OpenAI API: {str(e)}"
        )


@app.post("/parse-theorem-tree")
async def parse_theorem_tree(response: Dict):
    """
    Parse and extract structured information from a theorem proof tree.
    This demonstrates the different ways to analyze the proof tree.
    """
    # Create a ProofNode from the raw dictionary input if needed
    if isinstance(response, dict) and "proof_tree" in response:
        # Convert the dictionary to a ProofNode object
        theorem = response.get("theorem", "")
        proof_dict = response["proof_tree"]
        
        # Helper function to convert dict to ProofNode recursively
        def dict_to_proof_node(node_dict):
            children = []
            if "children" in node_dict and isinstance(node_dict["children"], list):
                for child_dict in node_dict["children"]:
                    children.append(dict_to_proof_node(child_dict))
            
            return ProofNode(
                step=node_dict.get("step", ""),
                explanation=node_dict.get("explanation"),
                children=children,
                is_leaf=node_dict.get("is_leaf", False)
            )
        
        # Convert the input dict to ProofNode
        proof_tree = dict_to_proof_node(proof_dict)
    else:
        # If not in the expected format, return an error
        raise HTTPException(status_code=400, detail="Invalid input format. Expected a dictionary with 'proof_tree' key.")
    
    # Extract data using our parser functions
    # Get nodes with their assumptions
    nodes_with_assumptions = get_nodes_with_assumptions(proof_tree)
    
    # Process each node with its assumptions, passing the original theorem
    processed_nodes = apply_processing_to_all_nodes(nodes_with_assumptions, original_theorem=theorem)
    
    result = {
        "theorem": theorem,
        "all_nodes": extract_all_nodes(proof_tree),
        "leaf_nodes": extract_leaf_nodes(proof_tree),
        "tree_structure": build_tree_structure(proof_tree),
        "node_count": len(extract_all_nodes(proof_tree)),
        "leaf_count": len(extract_leaf_nodes(proof_tree)),
        "max_depth": max(node["depth"] for node in extract_all_nodes(proof_tree)),
        "nodes_with_assumptions": nodes_with_assumptions,
        "processed_nodes": processed_nodes
    }
    
    # If there are leaf nodes, show a sample path to the first leaf
    leaf_nodes = extract_leaf_nodes(proof_tree)
    if leaf_nodes:
        first_leaf_id = leaf_nodes[0]["id"]
        result["sample_path_to_leaf"] = find_path_to_leaf(proof_tree, first_leaf_id)
    
    return result

# Parser functions for working with the proof tree
def extract_node_info(node: ProofNode) -> Dict:
    """Extract basic information from a node."""
    return {
        "step": node.step,
        "explanation": node.explanation,
        "is_leaf": node.is_leaf,
        "child_count": len(node.children)
    }

def extract_all_nodes(root: ProofNode) -> List[Dict]:
    """Extract all nodes from the tree in a flat list."""
    nodes = []
    
    def traverse(node, node_id, parent_id=None, depth=0):
        # Add current node with metadata
        node_info = extract_node_info(node)
        node_info['id'] = node_id
        node_info['parent_id'] = parent_id
        node_info['depth'] = depth
        nodes.append(node_info)
        
        # Process children
        for i, child in enumerate(node.children):
            child_id = f"{node_id}_{i}"
            traverse(child, child_id, node_id, depth + 1)
    
    traverse(root, "root")
    return nodes

def extract_leaf_nodes(root: ProofNode) -> List[Dict]:
    """Extract all leaf nodes from the tree."""
    all_nodes = extract_all_nodes(root)
    return [node for node in all_nodes if node["is_leaf"]]

def build_tree_structure(root: ProofNode) -> Dict:
    """Build a hierarchical representation of the tree."""
    def build_subtree(node):
        result = {
            "step": node.step,
            "explanation": node.explanation,
            "is_leaf": node.is_leaf,
        }
        
        if node.children:
            result["children"] = [build_subtree(child) for child in node.children]
        
        return result
    
    return build_subtree(root)

def find_node_by_id(root: ProofNode, target_id: str) -> Optional[ProofNode]:
    """Find a node by its ID using the same ID scheme as extract_all_nodes."""
    if target_id == "root":
        return root
    
    parts = target_id.split("_")
    current = root
    
    # Skip the first part ("root")
    for i in range(1, len(parts)):
        child_index = int(parts[i])
        if child_index < len(current.children):
            current = current.children[child_index]
        else:
            return None
    
    return current

def find_path_to_leaf(root: ProofNode, leaf_id: str) -> List[Dict]:
    """Find the path from root to a specific leaf node."""
    all_nodes = extract_all_nodes(root)
    node_dict = {node["id"]: node for node in all_nodes}
    
    path = []
    current_id = leaf_id
    
    while current_id is not None:
        if current_id in node_dict:
            path.append(node_dict[current_id])
            current_id = node_dict[current_id].get("parent_id")
        else:
            break
    
    # Reverse to get root-to-leaf order
    return list(reversed(path))

def get_nodes_with_assumptions(root: ProofNode) -> List[Tuple[Dict, List[Dict]]]:
    """Get each node paired with its children (assumptions).
    
    Returns:
        List of tuples where each tuple contains:
        - The node dictionary
        - A list of its children node dictionaries (assumptions)
    """
    # Extract all nodes with their IDs and parent IDs
    all_nodes = extract_all_nodes(root)
    
    # Create a dictionary to lookup nodes by ID
    node_dict = {node["id"]: node for node in all_nodes}
    
    # Group nodes by parent_id to find children of each node
    children_by_parent = {}
    for node in all_nodes:
        parent_id = node.get("parent_id")
        if parent_id is not None:
            if parent_id not in children_by_parent:
                children_by_parent[parent_id] = []
            children_by_parent[parent_id].append(node)
    
    # Create the list of (node, assumptions) tuples
    result = []
    for node in all_nodes:
        node_id = node["id"]
        assumptions = children_by_parent.get(node_id, [])
        result.append((node, assumptions))
    
    return result


def process_node_with_assumptions(node: Dict, assumptions: List[Dict], original_theorem: str = None) -> Dict:
    """Process a node and its assumptions, including validation through maestro.
    
    Args:
        node: The node to process
        assumptions: List of child nodes (assumptions)
        original_theorem: The original theorem text for context
        
    Returns:
        Processed result for the node with validation results
    """
    # Enhanced implementation with comprehensive metadata
    result = {
        # Node metadata
        "step": node["step"],
        "explanation": node.get("explanation", ""),
        "is_leaf": node.get("is_leaf", False),
        
        # Assumptions metadata
        "assumption_count": len(assumptions),
        "assumptions": [
            {
                "step": a["step"],
                "explanation": a.get("explanation", ""),
                "is_leaf": a.get("is_leaf", False)
            } for a in assumptions
        ]
    }
    
    # Only validate if we have assumptions
    if assumptions:
        try:
            # Extract steps and assumptions for validation
            step_content = node["step"]
            assumption_steps = [a["step"] for a in assumptions]
            
            # Use a dummy file ID - replace with actual file ID in production
            
            # Call maestro_rag for validation, passing the original theorem
            print(f"Calling maestro_rag for node: {node.get('id', 'unknown')} with {len(assumptions)} assumptions")
            validation_result = maestro_rag(
                step=step_content, 
                assumptions=assumption_steps, 
                original_theorem=original_theorem
            )
            
            # Add validation result to the response
            print("12345")
            result["validation_result"] = validation_result
        except Exception as e:
            print(f"Error calling maestro_rag: {str(e)}")
            result["validation_result"] = "error"
    else:
        # Skip validation if there are no assumptions
        result["validation_result"] = "skipped - no assumptions"
    
    print(result)
    return result


def apply_processing_to_all_nodes(nodes_with_assumptions: List[Tuple[Dict, List[Dict]]], original_theorem: str = None) -> List[Dict]:
    """Apply the processing function to all node-assumptions pairs.
    
    Args:
        nodes_with_assumptions: List of tuples containing (node, assumptions)
        original_theorem: The original theorem text for context
        
    Returns:
        List of processed results
    """
    results = []
    print("PROCESSING ALL NODES WITH ASSUMPTIONS")
    print(f"Original Theorem: {original_theorem}")
    
    for node, assumptions in nodes_with_assumptions:
        processed_result = process_node_with_assumptions(node, assumptions, original_theorem)
        results.append(processed_result)
    
    return results




def gpt_call(step:list[str], assumption: list[str], maestro_output):
    completion = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Given the steps: {step}, the assumptions: {assumption}, "
                    f"and the output: {maestro_output}, determine whether the output is correct. "
                    "Respond ONLY with a single digit: 1 if correct, 0 if incorrect. "
                    "Do not include any explanation or extra text."
                )
            }
        ]
    )
    print('this is output',completion.choices[0].message.content.strip())
    return completion.choices[0].message.content.strip()


def maestro_rag(step: str, assumptions: list[str], original_theorem: str = None):
    print("CALLING MAESTRO")
    run = client.beta.maestro.runs.create_and_poll(
        input=f"Prove this: {step} using this assumptions: {assumptions}",
        tools=[{"type": "file_search"}]

    )
    check = gpt_call(step=step, assumption=assumptions, maestro_output=run.result)

    # Make sure check is actually an integer
    try:
        if int(check) == 1:
            # The output was correct — handle accordingly
            return "success"
        else:
            return "failure"
    except ValueError:
        print(f"Unexpected model output, retrying with direct theorem processing")
        # Use the original theorem if provided, otherwise use a default theorem
        theorem_to_use = original_theorem if original_theorem else "The equation x^2 + 2x = i has two complex solutions and determine the product of their real parts."
        theorem_req = TheoremRequest(theorem=theorem_to_use)
        return process_theorem(request=theorem_req, parse_tree=True)
