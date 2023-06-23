# Use the official Python image as the base image
FROM docker.io/library/python:3.11-bullseye

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements.txt file to the working directory
COPY requirements.txt .

# Install the dependencies
RUN pip install -r requirements.txt

# Copy the backend folder to the working directory
COPY backend backend

# Expose the port that the FastAPI application will listen on
EXPOSE 8000

# Set the entry point command to run the FastAPI application
CMD ["uvicorn", "backend.app.api:app", "--host", "0.0.0.0", "--port", "8000"]
