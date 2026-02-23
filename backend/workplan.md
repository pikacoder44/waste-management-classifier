## how to just make backend in python and use Next.js for frontend?

To create a backend in Python and use Next.js for the frontend, you can follow these steps:

1. Set up the backend:
   - Choose a web framework for Python, such as Flask.
   - Create a new project and set up your API endpoints to handle requests from the frontend.
   - Use a tool like `pip` to manage your dependencies and install any necessary libraries.

2. Set up the frontend:
   - Create a new Next.js project using `npx create-next-app`.
   - Develop your frontend components and pages using React and Next.js.
   - Use `fetch` or a library like `axios` to make API calls to your Python backend.

3. Connect the frontend and backend:
   - Ensure that your backend is running and accessible (e.g., on `http://localhost:5000`).
   - In your Next.js frontend, make API calls to the backend endpoints you created.
   - Handle the responses from the backend and update your frontend UI accordingly.

4. Run both the backend and frontend:
   - Start your Python backend server (e.g., `python app.py`).
   - Start your Next.js development server (e.g., `npm run dev`).
   - Open your browser and navigate to the Next.js frontend (e.g., `http://localhost:3000`) to see the application in action.

## API Endpoints
      ------------------------
      |  POST   /predict     |
      |  GET    /evaluation  |
      |  GET    /model-info  |
      ------------------------

      
