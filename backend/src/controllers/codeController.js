const supabase = require('../config/supabaseClient');
const { execSync } = require('child_process');
const fsModule = require('fs');
const path = require('path');
const os = require('os');

function executeCodeLocally(language, sourceCode, stdin) {
    const tmpDir = os.tmpdir();
    const fileName = 'main_' + Date.now() + Math.floor(Math.random()*1000);
    let result = { run: { code: 0, stdout: '', output: '' }, compile: { code: 0, output: '' } };

    try {
        if (language === 'javascript') {
            const filePath = path.join(tmpDir, fileName + '.js');
            fsModule.writeFileSync(filePath, sourceCode);
            try {
                result.run.stdout = execSync('node ' + filePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
            } catch (err) {
                result.run.code = err.status || 1;
                result.run.output = err.stderr || err.message;
            }
            if(fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
        } else if (language === 'python') {
            const filePath = path.join(tmpDir, fileName + '.py');
            fsModule.writeFileSync(filePath, sourceCode);
            try {
                result.run.stdout = execSync('python ' + filePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
            } catch (err) {
                result.run.code = err.status || 1;
                result.run.output = err.stderr || err.message;
            }
            if(fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
        } else if (language === 'cpp') {
            const filePath = path.join(tmpDir, fileName + '.cpp');
            const exePath = path.join(tmpDir, fileName + '.exe');
            fsModule.writeFileSync(filePath, sourceCode);
            try {
                execSync('g++ ' + filePath + ' -o ' + exePath, { timeout: 10000, encoding: 'utf-8', stdio: 'pipe' });
                try {
                    result.run.stdout = execSync(exePath, { input: stdin, timeout: 3000, encoding: 'utf-8', stdio: 'pipe' });
                } catch (runErr) {
                    result.run.code = runErr.status || 1;
                    result.run.output = runErr.stderr || runErr.message;
                }
                if (fsModule.existsSync(exePath)) fsModule.unlinkSync(exePath);
            } catch (compileErr) {
                result.compile.code = compileErr.status || 1;
                result.compile.output = compileErr.stderr || compileErr.message;
            }
            if(fsModule.existsSync(filePath)) fsModule.unlinkSync(filePath);
        } else {
            result.run.code = 1;
            result.run.output = 'Language not supported locally';
        }
    } catch (e) {
        result.run.code = 1;
        result.run.output = 'Local execution wrapper failed: ' + e.message;
    }
    return result;
}

const PISTON_LANGUAGE_MAP = {
  'javascript': { language: 'javascript', version: '18.15.0' },
  'python': { language: 'python', version: '3.10.0' },
  'cpp': { language: 'c++', version: '10.2.0' },
  'java': { language: 'java', version: '15.0.2' },
};

const POINTS_MAP = {
  'Easy': 10,
  'Medium': 20,
  'Hard': 40
};

const HINT_PENALTY = 5;

exports.submitCode = async (req, res) => {
  try {
    const { userId, questionId, sourceCode, language } = req.body;

    if (!userId || !questionId || !sourceCode || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Fetch Question Data
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('test_cases, difficulty')
      .eq('id', questionId)
      .single();

    if (questionError || !question || !question.test_cases) {
      return res.status(404).json({ error: 'Question or test cases not found' });
    }

    // 2. Fetch hints used from DB tracking
    const { data: session } = await supabase
      .from('question_sessions')
      .select('hints_used')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    const hintsUsed = session ? session.hints_used : 0;

    const testCases = question.test_cases; 
    let allPassed = true;
    let failedTestCase = null;
    let compilationError = null;

    const langConfig = PISTON_LANGUAGE_MAP[language];
    if (!langConfig) return res.status(400).json({ error: 'Unsupported language' });

    // 3. Execute Code via Piston
    for (const testCase of testCases) {
      const result = executeCodeLocally(language, sourceCode, testCase.input);

      if (result.compile && result.compile.code !== 0) {
        compilationError = result.compile.output;
        allPassed = false;
        break;
      }
      
      if (result.run && result.run.code !== 0) {
        compilationError = result.run.output; 
        allPassed = false;
        break;
      }

      const actualOutput = (result.run.stdout || '').trim();
      const expectedOutput = (testCase.expected_output || '').trim();

      if (actualOutput !== expectedOutput) {
        allPassed = false;
        failedTestCase = { input: testCase.input, expected: expectedOutput, actual: actualOutput };
        break;
      }
    }

    let status = 'Accepted';
    if (compilationError) status = 'Compilation Error';
    else if (!allPassed) status = 'Wrong Answer';

    // 4. Database Logging (Heatmap & History)
    const { error: submissionError } = await supabase.from('submissions').insert({
      user_id: userId,
      question_id: questionId,
      code: sourceCode,
      language: language,
      status: status,
      hints_used: hintsUsed
    });
    
    if (submissionError) console.error("Error logging submission:", submissionError);

    // 5. The Gamification & Scoring Math (Only if Accepted)
    let pointsEarned = 0;
    if (status === 'Accepted') {
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (userStats) {
        const { data: previousSolves } = await supabase
          .from('submissions')
          .select('id')
          .eq('user_id', userId)
          .eq('question_id', questionId)
          .eq('status', 'Accepted')
          .limit(2);

        const isFirstSolve = previousSolves && previousSolves.length === 1;

        if (isFirstSolve) {
          const { data: previousAccepted } = await supabase
            .from('submissions')
            .select('submitted_at')
            .eq('user_id', userId)
            .eq('status', 'Accepted')
            .order('submitted_at', { ascending: false })
            .limit(2);
            
          let newStreak = userStats.streak;
          
          if (previousAccepted && previousAccepted.length > 1) {
            const lastDate = new Date(previousAccepted[1].submitted_at);
            const currentDate = new Date();
            
            lastDate.setHours(0,0,0,0);
            const today = new Date(currentDate);
            today.setHours(0,0,0,0);
            
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            if (diffDays === 1) {
               newStreak += 1; 
            } else if (diffDays > 1) {
               newStreak = 1; 
            } 
          } else {
             newStreak = 1;
          }

          const basePoints = POINTS_MAP[question.difficulty] || 10;
          pointsEarned = Math.max(0, (basePoints * newStreak) - (hintsUsed * HINT_PENALTY));
          
          const newTotalScore = userStats.total_score + pointsEarned;

          const updates = {
            streak: newStreak,
            total_score: newTotalScore,
            total_hints_used: userStats.total_hints_used + hintsUsed
          };
          
          if (question.difficulty === 'Easy') updates.easy_solved = userStats.easy_solved + 1;
          if (question.difficulty === 'Medium') updates.medium_solved = userStats.medium_solved + 1;
          if (question.difficulty === 'Hard') updates.hard_solved = userStats.hard_solved + 1;

          await supabase.from('user_stats').update(updates).eq('user_id', userId);

          // Clear hints tracker since problem is solved
          await supabase.from('question_sessions').delete().eq('user_id', userId).eq('question_id', questionId);
        }
      }
    }

    res.status(200).json({
      status,
      message: status === 'Accepted' ? 'All test cases passed!' : 'Code execution failed',
      pointsEarned,
      details: {
        compilationError,
        failedTestCase
      }
    });

  } catch (error) {
    console.error('Error in execution engine:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.generateHint = async (req, res) => {
  try {
    const { userId, questionId, sourceCode } = req.body;
    
    if (!userId || !questionId) {
      return res.status(400).json({ error: 'userId and questionId are required' });
    }

    // AI Mock Logic (would call OpenAI/Gemini API here)
    const hint = "Consider looking at your edge cases. Have you tried approaching this with a two-pointer technique or checking for null inputs?";

    // Upsert into question_sessions to track hints_used
    const { data: session, error: fetchError } = await supabase
      .from('question_sessions')
      .select('hints_used')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();
      
    let newHintsUsed = 1;
    if (session) {
       newHintsUsed = session.hints_used + 1;
       await supabase.from('question_sessions').update({ hints_used: newHintsUsed }).eq('user_id', userId).eq('question_id', questionId);
    } else {
       await supabase.from('question_sessions').insert({ user_id: userId, question_id: questionId, hints_used: 1 });
    }

    res.status(200).json({
      hint,
      totalHintsUsed: newHintsUsed,
      message: 'Hint generated and penalty tracker incremented.'
    });

  } catch (error) {
    console.error('Error generating AI hint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
