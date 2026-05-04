# How to Run the SRS Estimator Project

Follow these steps to efficiently run the server and view the frontend.

## 1. Start the Server

We need to launch the Python backend server using your virtual environment to ensure all dependencies load correctly.

Run the following command in your terminal while inside the `srs-estimator` directory:
```bash
source venv/bin/activate && python main.py
```

*This command does two things:*
1. Activates the Python virtual environment (`venv`) isolating your dependencies.
2. Runs the `main.py` FastAPI server using Uvicorn.

## 2. Access the Application

Once you see the server running, it will automatically serve the frontend web page and API.

Open your browser and navigate to:
**[http://localhost:8000/](http://localhost:8000/)**

*Notes:*
- The frontend (`index.html`) is served directly by the server, so no separate frontend command is needed. 
- You can access the auto-generated API documentation to test the estimate endpoint at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

## 3. Stop the Server

To stop the development server when you are finished, press `CTRL+C` in the terminal where it's running.
