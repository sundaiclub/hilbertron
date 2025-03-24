# Minimal FastAPI Demo Backend

A lightweight FastAPI application for demo purposes that stores information locally without using Pydantic or databases.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

- `GET /`: Welcome message
- `GET /items`: Get all items
- `GET /items/{item_id}`: Get a specific item by ID
- `POST /items`: Create a new item (send JSON in request body)
- `PUT /items/{item_id}`: Update an item (send JSON in request body)
- `DELETE /items/{item_id}`: Delete an item
- `POST /save`: Save current data to disk (data.json)
- `POST /load`: Load saved data from disk

## Example Usage

```bash
# Create a new item
curl -X POST "http://localhost:8000/items" -H "Content-Type: application/json" -d '{"name":"Example item","value":42}'

# Get all items
curl "http://localhost:8000/items"

# Save data
curl -X POST "http://localhost:8000/save"
```

## Interactive API Documentation

FastAPI automatically generates API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
