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
  const [activeTab, setActiveTab] = useState('testcases');
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [activeResultCase, setActiveResultCase] = useState(0);
  const [learningOpen, setLearningOpen] = useState(false);
  const [learningSaved, setLearningSaved] = useState(false);
  const [learningError, setLearningError] = useState('');
  const [learningBusy, setLearningBusy] = useState(false);
  const [acceptedCode, setAcceptedCode] = useState('');
  const [acceptedLanguage, setAcceptedLanguage] = useState('javascript');
  const [libraryFolders, setLibraryFolders] = useState([]);
  const [learning, setLearning] = useState({ approach: '', edge_cases: '', time_complexity: '', space_complexity: '', folder_id: '', schedule_review: true });
  const { user } = useAuth();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await api.get(`/api/questions/${id}`);
        const q = response.data;
        setQuestion(q);
        setSourceCode(q.starter_code?.['javascript'] || DEFAULT_CODE['javascript']);
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
    setSourceCode(question?.starter_code?.[newLang] || DEFAULT_CODE[newLang]);
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
      const errMsg = error.response?.data?.error || 'Failed to fetch hint. Please check backend logs or API keys.';
      setHints(prev => [...prev, `Error: ${errMsg}`]);
    } finally {
      setIsFetchingHint(false);
    }
  };

  const handleSubmit = async (isRun = false) => {
    if (!question || !sourceCode.trim()) return;
    
    setIsSubmitting(true);
    setExecutionResult(null);
    
    try {
      const response = await api.post('/api/code/submit', {
        userId: user.id,
        questionId: question.id,
        sourceCode: sourceCode,
        language: language,
        isRun: isRun,
        customInput: (isRun && useCustomInput) ? customInput : undefined
      });
      setExecutionResult(response.data);
      setActiveTab('results');
      setActiveResultCase(0);
      if (!isRun && response.data.status === 'Accepted') {
        setAcceptedCode(sourceCode);
        setAcceptedLanguage(language);
        setLearningSaved(false);
        setLearningOpen(true);
        api.get('/api/library/folders').then(res => setLibraryFolders(res.data)).catch(() => {});
      }
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

  const saveLearning = async (event) => {
    event.preventDefault(); setLearningBusy(true); setLearningError('');
    try {
      const { data: saved } = await api.get('/api/library/items');
      const existing = saved.find(item => item.source === 'smartleetcode' && item.question_id === question.id);
      const payload = { ...learning, source: 'smartleetcode', question_id: question.id, solution_code: acceptedCode, language: acceptedLanguage };
      if (existing && learning.schedule_review && existing.next_review_at) delete payload.schedule_review;
      if (existing) await api.patch(`/api/library/items/${existing.id}`, payload);
      else await api.post('/api/library/items', payload);
      setLearningOpen(false); setLearningSaved(true);
    } catch (e) { setLearningError(e.response?.data?.error || 'Could not save what you learned'); }
    finally { setLearningBusy(false); }
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

          {/* Sample Test Cases */}
          {question.test_cases && question.test_cases.length > 0 && (
            <div className="mb-8 border-t border-gray-700 pt-6">
              <h3 className="text-xl font-bold text-white mb-4">Sample Test Cases</h3>
              <div className="space-y-4">
                {question.test_cases.slice(0, 2).map((tc, idx) => (
                  <div key={idx} className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-inner">
                    <div className="mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Input</span>
                      <pre className="text-gray-300 font-mono text-sm mt-1 whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Expected Output</span>
                      <pre className="text-green-400 font-mono text-sm mt-1 whitespace-pre-wrap">{tc.expected_output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          
          <div className="space-x-3">
            <button 
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-5 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold rounded transition-colors border border-gray-600"
            >
              Run
            </button>
            <button 
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-6 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded transition-colors shadow-lg shadow-green-500/30"
            >
              {isSubmitting ? 'Running...' : 'Submit'}
            </button>
          </div>
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
          <div className="flex bg-gray-800 border-b border-gray-700">
            <button 
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'testcases' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('testcases')}
            >
              Testcases
            </button>
            <button 
              className={`px-4 py-2 text-sm font-bold ${activeTab === 'results' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
              onClick={() => setActiveTab('results')}
            >
              Test Result
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto font-mono text-sm">
            {activeTab === 'testcases' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="useCustom" 
                    checked={useCustomInput}
                    onChange={(e) => setUseCustomInput(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="useCustom" className="text-sm font-bold text-gray-300 cursor-pointer">Use Custom Testcase</label>
                </div>
                
                {useCustomInput ? (
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter your custom testcase input here..."
                    className="w-full h-32 bg-gray-800 text-gray-300 border border-gray-700 rounded p-3 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                ) : (
                  question?.test_cases?.slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-gray-800 rounded p-3 border border-gray-700">
                      <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Case {idx + 1} Input:</span>
                      <pre className="text-gray-300 whitespace-pre-wrap">{tc.input}</pre>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                {!executionResult && !isSubmitting && (
                  <span className="text-gray-500">Run your code to see the output here.</span>
                )}
                
                {isSubmitting && (
                  <span className="text-blue-400 animate-pulse">Compiling and running tests...</span>
                )}

                {executionResult && (
                  <div className="space-y-4">
                    <div className="flex items-center flex-wrap gap-3">
                      <span className={`text-lg font-bold ${
                        executionResult.status === 'Accepted' ? 'text-green-500' : 
                        executionResult.status === 'Wrong Answer' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        {executionResult.status}
                      </span>
                      
                      {executionResult.totalCount !== undefined && (
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs border border-gray-700 font-medium">
                          {executionResult.passedCount} / {executionResult.totalCount} Test Cases Passed
                        </span>
                      )}

                      {executionResult.pointsEarned > 0 && (
                        <span className="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs border border-green-800">
                          +{executionResult.pointsEarned} Points
                        </span>
                      )}
                    </div>
                    {executionResult.status === 'Accepted' && <div className="flex items-center gap-3 text-sm"><button onClick={() => setLearningOpen(true)} className="rounded bg-blue-600 px-3 py-2 font-semibold hover:bg-blue-500">{learningSaved ? 'Edit what I learned' : 'Save what I learned'}</button>{learningSaved && <span className="text-green-400">Saved to My Library</span>}</div>}

                    {executionResult.details?.compilationError ? (
                      <div className="p-3 bg-red-950/50 border border-red-900 rounded text-red-400 overflow-x-auto whitespace-pre-wrap">
                        {executionResult.details.compilationError}
                      </div>
                    ) : executionResult.details?.testResults ? (
                      <div>
                        {/* Case Pills */}
                        <div className="flex space-x-2 mb-4">
                          {executionResult.details.testResults.map((tr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveResultCase(idx)}
                              className={`px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-2 ${activeResultCase === idx ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-500 hover:text-gray-300'}`}
                            >
                              <div className={`w-2 h-2 rounded-full ${tr.passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span>Case {idx + 1}</span>
                            </button>
                          ))}
                        </div>
                        
                        {/* Selected Case Detail */}
                        {executionResult.details.testResults[activeResultCase] && (
                          <div className="space-y-3">
                            <div className="p-3 bg-gray-800 rounded border border-gray-700">
                              <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Input:</span>
                              <code className="text-gray-300">{executionResult.details.testResults[activeResultCase].input}</code>
                            </div>
                            <div className="p-3 bg-gray-800 rounded border border-gray-700">
                              <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Actual Output:</span>
                              <code className={executionResult.details.testResults[activeResultCase].passed ? "text-green-400" : "text-red-400"}>
                                {executionResult.details.testResults[activeResultCase].actual || ' '}
                              </code>
                            </div>
                            {executionResult.details.testResults[activeResultCase].expected !== 'Custom Output Not Validated' && (
                              <div className="p-3 bg-gray-800 rounded border border-gray-700">
                                <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Expected Output:</span>
                                <code className="text-green-400">{executionResult.details.testResults[activeResultCase].expected}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : executionResult.details?.failedTestCase && (
                      <div className="space-y-3">
                        <div className="p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Input:</span>
                          <code className="text-gray-300">{executionResult.details.failedTestCase.input}</code>
                        </div>
                        <div className="p-3 bg-gray-800 rounded border border-red-900/50">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Actual Output:</span>
                          <code className="text-red-400">{executionResult.details.failedTestCase.actual}</code>
                        </div>
                        <div className="p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-500 block text-xs font-bold mb-1 uppercase tracking-wider">Expected Output:</span>
                          <code className="text-green-400">{executionResult.details.failedTestCase.expected}</code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {learningOpen && <div role="dialog" aria-modal="true" aria-label="Save what I learned" className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={saveLearning} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-600 bg-gray-800 p-6 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Save what I learned</h2><button type="button" onClick={() => setLearningOpen(false)} aria-label="Close" className="text-gray-300 hover:text-white">✕</button></div><p className="mb-4 text-sm text-gray-400">Your accepted code is filled in automatically. Add notes and a review schedule.</p>{learningError && <p role="alert" className="mb-3 text-red-300">{learningError}</p>}<div className="space-y-3">{[['approach', 'Approach / what I learned'], ['edge_cases', 'Edge cases']].map(([key, title]) => <label key={key} className="block text-sm text-gray-300">{title}<textarea className="mt-1 w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" rows="3" value={learning[key]} onChange={e => setLearning(prev => ({ ...prev, [key]: e.target.value }))} /></label>)}<div className="grid grid-cols-2 gap-3">{[['time_complexity', 'Time complexity'], ['space_complexity', 'Space complexity']].map(([key, title]) => <label key={key} className="text-sm text-gray-300">{title}<input className="mt-1 w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" placeholder="O(n)" value={learning[key]} onChange={e => setLearning(prev => ({ ...prev, [key]: e.target.value }))} /></label>)}</div><label className="block text-sm text-gray-300">Folder<select className="mt-1 w-full rounded border border-gray-600 bg-gray-900 p-2 text-white" value={learning.folder_id} onChange={e => setLearning(prev => ({ ...prev, folder_id: e.target.value }))}><option value="">No folder</option>{libraryFolders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><label className="flex gap-2 text-sm text-gray-300"><input type="checkbox" checked={learning.schedule_review} onChange={e => setLearning(prev => ({ ...prev, schedule_review: e.target.checked }))} /> Schedule a review</label><label className="block text-sm text-gray-300">Accepted code<textarea readOnly className="mt-1 h-32 w-full rounded border border-gray-600 bg-gray-900 p-2 font-mono text-xs text-gray-200" value={acceptedCode} /></label></div><button disabled={learningBusy} className="mt-4 rounded bg-green-600 px-4 py-2 font-semibold hover:bg-green-500 disabled:opacity-50">{learningBusy ? 'Saving...' : 'Save to My Library'}</button></form></div>}

    </div>
  );
};

export default Problem;
