# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


AI-Powered E-Learning Platform
This project is a blueprint for a modern e-learning platform that uses AI to provide personalized course recommendations. It's built with a React frontend and a FastAPI backend.

Ideal Project Structure
For a real-world application, you would separate your frontend and backend into two distinct folders. The code I've provided in the other files can be used as the basis for this structure.

        

How to Run This Project
Backend (FastAPI)
Navigate to the backend directory.

Create a virtual environment:

python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

Install dependencies:

pip install -r requirements.txt

Run the server:

uvicorn main:app --reload

The API will be available at http://127.0.0.1:8000. You can see the interactive documentation at http://127.0.0.1:8000/docs.

Frontend (React)
Navigate to the frontend directory.

Install dependencies:

npm install

Start the development server:

npm start

The application will open in your browser at http://localhost:3000.
