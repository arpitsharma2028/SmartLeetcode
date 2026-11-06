import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Problems = () => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const url = user?.id ? `/api/questions?userId=${user.id}` : '/api/questions';
        const response = await api.get(url);
        setQuestions(response.data);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [user?.id]);

  if (isLoading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Loading problems...</div>;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e0f11] px-5 py-10 text-[#e9e9e8] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <p className="theme-eyebrow mb-2">Find your next challenge</p>
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-[#eeece8]">Practice Problems</h1>
        
        {questions.length === 0 ? (
          <div className="text-gray-400">No problems found in the database.</div>
        ) : (
          <div className="theme-panel overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2a2e33] bg-[#17191c]">
                  <th className="px-6 py-4 font-semibold text-gray-300">Title</th>
                  <th className="px-6 py-4 font-semibold text-gray-300">Difficulty</th>
                  <th className="px-6 py-4 font-semibold text-gray-300 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q, idx) => (
                  <tr key={q.id} className={`border-b border-[#2a2e33] transition-colors hover:bg-[#1d2024] ${idx % 2 === 0 ? 'bg-[#15171a]' : 'bg-[#121417]'}`}>
                    <td className="px-6 py-4 text-white font-medium flex items-center space-x-2">
                      {q.is_solved && <span className="text-green-500 font-bold" title="Solved">✓</span>}
                      <span>{q.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold 
                        ${q.difficulty === 'Easy' ? 'bg-green-900/50 text-green-400 border border-green-800' : 
                          q.difficulty === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800' : 
                          'bg-red-900/50 text-red-400 border border-red-800'}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/problem/${q.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors text-sm shadow-md shadow-blue-500/20"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Problems;
