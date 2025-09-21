import React, { useState, useEffect, useMemo } from 'react';

// This single file contains all the necessary React components for a basic proof-of-concept.
// In a real application, these would be split into separate files (e.g., components/, pages/, services/).

// --- MOCK API Service ---
// This object simulates API calls to the FastAPI backend.
const api = {
  // Simulates logging in and getting a token
  login: async (username, password) => {
    // In a real app, this would be:
    // const response = await fetch('http://127.0.0.1:8000/token', { ... });
    console.log("Attempting login for:", username);
    if (username === 'testuser' && password === 'password') {
      return { access_token: 'fake-jwt-token', token_type: 'bearer' };
    }
    throw new Error('Invalid credentials');
  },
  // Simulates fetching user data with a token
  getMe: async (token) => {
    console.log("Fetching user data with token:", token);
    if (token) {
        return {
            id: 1,
            username: "testuser",
            email: "test@example.com",
            enrolled_courses: [101, 103]
        };
    }
    throw new Error('Not authenticated');
  },
  // Simulates fetching all available courses
  getCourses: async () => {
    console.log("Fetching all courses");
    return [
      { id: 101, title: "Introduction to Python", category: "Programming", difficulty: "Beginner" },
      { id: 102, title: "Advanced Python", category: "Programming", difficulty: "Advanced" },
      { id: 103, title: "Data Science with Pandas", category: "Data Science", difficulty: "Intermediate" },
      { id: 104, title: "Machine Learning Fundamentals", category: "Data Science", difficulty: "Intermediate" },
      { id: 105, title: "Web Development with React", category: "Web Development", difficulty: "Beginner" },
    ];
  },
  // Simulates fetching AI-powered recommendations
  getRecommendations: async (userId, token) => {
    console.log(`Fetching recommendations for user ${userId} with token ${token}`);
     if (token) {
        // This simulates the backend logic: recommend courses in the same category as enrolled ones.
        return [
            { id: 102, title: "Advanced Python", category: "Programming", difficulty: "Advanced", reason: "Because you are taking 'Introduction to Python'" },
            { id: 104, title: "Machine Learning Fundamentals", category: "Data Science", difficulty: "Intermediate", reason: "Because you are taking 'Data Science with Pandas'"},
        ];
    }
    throw new Error('Not authenticated');
  }
};

// --- UI Components ---

const CourseCard = ({ course, isEnrolled, reason }) => (
  <div className={`p-4 border rounded-lg shadow-md transition-transform transform hover:-translate-y-1 ${isEnrolled ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
    <h3 className="text-xl font-bold text-gray-800">{course.title}</h3>
    <div className="flex space-x-2 text-sm text-gray-500 mt-2">
      <span className="bg-gray-200 px-2 py-1 rounded-full">{course.category}</span>
      <span className="bg-green-200 px-2 py-1 rounded-full">{course.difficulty}</span>
    </div>
    {isEnrolled && <p className="text-sm font-semibold text-blue-600 mt-2">Enrolled</p>}
    {reason && <p className="text-sm italic text-purple-600 mt-2">✨ {reason}</p>}
  </div>
);

const LoginScreen = ({ setToken }) => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(username, password);
      setToken(data.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">AI E-Learning Login</h2>
        <form onSubmit={handleLogin}>
          {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="testuser"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="password"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-300">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = ({ user, token, setToken }) => {
    const [courses, setCourses] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesData, recsData] = await Promise.all([
                    api.getCourses(),
                    api.getRecommendations(user.id, token)
                ]);
                setCourses(coursesData);
                setRecommendations(recsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && token) {
            fetchData();
        }
    }, [user, token]);

    const enrolledCourseIds = useMemo(() => new Set(user.enrolled_courses || []), [user]);

    if (loading) {
        return <div className="text-center p-10">Loading Dashboard...</div>
    }

    return (
        <div className="container mx-auto p-6">
             <header className="flex justify-between items-center mb-8 pb-4 border-b">
                <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.username}!</h1>
                <button onClick={() => setToken(null)} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                    Logout
                </button>
            </header>

            <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">✨ Recommended For You</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {recommendations.map(rec => <CourseCard key={`rec-${rec.id}`} course={rec} reason={rec.reason} />)}
                </div>
            </section>

             <section>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">All Courses</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => <CourseCard key={course.id} course={course} isEnrolled={enrolledCourseIds.has(course.id)} />)}
                </div>
            </section>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to get user data once a token is available
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const userData = await api.getMe(token);
          setUser(userData);
        } catch (error) {
          console.error("Failed to fetch user:", error);
          setToken(null); // Invalid token, clear it
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  if(loading) {
      return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>
  }

  if (!token || !user) {
    return <LoginScreen setToken={setToken} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Dashboard user={user} token={token} setToken={setToken} />
    </div>
  );
}
