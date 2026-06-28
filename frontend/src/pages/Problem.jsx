import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CODE = {
  javascript: 'function solve() {\n  // Write your code here\n}\n',
  python: 'def solve():\n    # Write your code here\n    pass\n',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n'
};

const Problem = () => {
  const { id } = useParams();
  
  const [question, setQuestion] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE['javascript']);
  const [hints, setHints] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingHint, setIsFetchingHint] = useState(false);
  
  const [executionResult, setExecutionResult] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await api.get(`/api/questions/${id}`);
        setQuestion(response.data);
      } catch (error) {
        console.error('Failed to fetch question:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestion();
  }, [id]);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    // Only reset code if they haven't typed much, or prompt them. For simplicity, just reset.
    setSourceCode(DEFAULT_CODE[newLang]);
  };

  const handleGetHint = async () => {
    if (!question) return;
    setIsFetchingHint(true);
    try {
      const response = await api.post('/api/code/hint', {
        userId: user.id,
        questionId: question.id,
        sourceCode: sourceCode
      });
      setHints(prev => [...prev, response.data.hint]);
    } catch (error) {
      console.error('Failed to get hint:', error);
    } finally {
      setIsFetchingHint(false);
    }
  };

  const handleSubmit = async () => {
    if (!question || !sourceCode.trim()) return;
    
    setIsSubmitting(true);
    setExecutionResult(null);
    
    try {
      const response = await api.post('/api/code/submit', {
        userId: user.id,
        questionId: question.id,
        sourceCode: sourceCode,
        language: language
      });
      setExecutionResult(response.data);
    } catch (error) {
      console.error('Submission failed:', error);
      setExecutionResult({
        status: 'Error',
        message: 'Failed to communicate with execution server.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-white">Loading Problem...</div>;
  }

  if (!question) {
    return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center text-red-400">Problem not found.</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-gray-200 font-sans">
      
      {/* Left Pane: Problem Description */}
      <div className="w-1/2 flex flex-col border-r border-gray-700 bg-gray-800">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">{question.title}</h1>
            <span className={`px-3 py-1 rounded text-sm font-semibold 
              ${question.difficulty === 'Easy' ? 'bg-green-900 text-green-300' : 
                question.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' : 
                'bg-red-900 text-red-300'}`}>
              {question.difficulty}
            </span>
          </div>
          
          <div className="prose prose-invert max-w-none text-gray-300 mb-8" 
               dangerouslySetInnerHTML={{ __html: question.description.replace(/\n/g, '<br/>') }} />

          {/* AI Hints Section */}
          <div className="mt-8 border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-400">AI Mentor</h3>
              <button 
                onClick={handleGetHint}
                disabled={isFetchingHint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-medium transition-colors text-sm shadow-md shadow-blue-500/20"
              >
                {isFetchingHint ? 'Thinking...' : 'Get a Hint'}
              </button>
            </div>
            
            {hints.length > 0 ? (
              <div className="space-y-3">
                {hints.map((hint, idx) => (
                  <div key={idx} className="p-4 bg-blue-900/30 border border-blue-800 rounded-lg text-sm text-blue-100">
                    <span className="font-bold text-blue-300 mr-2">Hint {idx + 1}:</span>
                    {hint}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">Stuck? Ask the AI mentor for a nudge in the right direction.</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Pane: Code Editor & Console */}
      <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <select 
            value={language} 
            onChange={handleLanguageChange}
            className="bg-gray-700 text-white text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded transition-colors shadow-lg shadow-green-500/30"
          >
            {isSubmitting ? 'Running...' : 'Submit'}
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language}
            theme="vs-dark"
            value={sourceCode}
            onChange={(val) => setSourceCode(val || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              padding: { top: 16 }
            }}
          />
        </div>

        {/* Execution Console */}
        <div className="h-64 bg-gray-900 border-t border-gray-700 flex flex-col">
          <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Console Output</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm">
            {!executionResult && !isSubmitting && (
              <span className="text-gray-500">Run your code to see the output here.</span>
            )}
            
            {isSubmitting && (
              <span className="text-blue-400 animate-pulse">Compiling and running tests on engine...</span>
            )}

            {executionResult && (
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className={`text-lg font-bold ${
                    executionResult.status === 'Accepted' ? 'text-green-500' : 
                    executionResult.status === 'Wrong Answer' ? 'text-red-500' : 'text-yellow-500'
                  }`}>
                    {executionResult.status}
                  </span>
                  {executionResult.pointsEarned > 0 && (
                    <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs border border-green-800">
                      +{executionResult.pointsEarned} Points
                    </span>
                  )}
                </div>
                
                <p className="text-gray-300">{executionResult.message}</p>

                {executionResult.details?.compilationError && (
                  <div className="mt-2 p-3 bg-red-950/50 border border-red-900 rounded text-red-400 overflow-x-auto whitespace-pre-wrap">
                    {executionResult.details.compilationError}
                  </div>
                )}

                {executionResult.details?.failedTestCase && (
                  <div className="mt-4 space-y-2">
                    <div className="p-2 bg-gray-800 rounded">
                      <span className="text-gray-500 block text-xs mb-1">Input:</span>
                      <code className="text-gray-300">{executionResult.details.failedTestCase.input}</code>
                    </div>
                    <div className="p-2 bg-gray-800 rounded">
                      <span className="text-gray-500 block text-xs mb-1">Expected Output:</span>
                      <code className="text-green-400">{executionResult.details.failedTestCase.expected}</code>
                    </div>
                    <div className="p-2 bg-gray-800 rounded border border-red-900/50">
                      <span className="text-gray-500 block text-xs mb-1">Actual Output:</span>
                      <code className="text-red-400">{executionResult.details.failedTestCase.actual}</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Problem;
