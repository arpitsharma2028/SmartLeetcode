-- 1. Insert Topics first
INSERT INTO public.topics (id, name, description) VALUES
(1, 'Arrays & Hashing', 'Questions that involve arrays, hash maps, and hash sets.'),
(2, 'Two Pointers', 'Questions that are efficiently solved using two pointers.'),
(3, 'Stack', 'Questions that involve stack data structure (LIFO).')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Questions
INSERT INTO public.questions (title, topic_id, difficulty, description, test_cases, starter_code) VALUES
(
    'Two Sum',
    1,
    'Easy',
    'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
    '[
        {"input": "nums = [2,7,11,15], target = 9", "expected_output": "[0,1]"},
        {"input": "nums = [3,2,4], target = 6", "expected_output": "[1,2]"},
        {"input": "nums = [3,3], target = 6", "expected_output": "[0,1]"}
    ]'::jsonb,
    '{"cpp":"#include <iostream>\n#include <vector>\n#include <unordered_map>\n#include <string>\n#include <sstream>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        return {};\n    }\n};\n\nint main() {\n    string input;\n    if (!getline(cin, input)) return 0;\n    size_t bracketStart = input.find(''['');\n    size_t bracketEnd = input.find('']'');\n    string arrayStr = input.substr(bracketStart + 1, bracketEnd - bracketStart - 1);\n    vector<int> nums;\n    stringstream ss(arrayStr);\n    string token;\n    while (getline(ss, token, '','')) {\n        nums.push_back(stoi(token));\n    }\n    size_t targetPos = input.find(\"target = \");\n    int target = stoi(input.substr(targetPos + 9));\n    Solution sol;\n    vector<int> result = sol.twoSum(nums, target);\n    if (result.size() == 2) {\n        cout << \"[\" << result[0] << \",\" << result[1] << \"]\" << endl;\n    } else {\n        cout << \"[]\" << endl;\n    }\n    return 0;\n}","javascript":"const fs = require(''fs'');\n\nvar twoSum = function(nums, target) {\n    // Write your code here\n    return [];\n};\n\nfunction main() {\n    try {\n        const input = fs.readFileSync(''/dev/stdin'', ''utf-8'').trim();\n        if (!input) return;\n        const numsStrMatch = input.match(/nums = (\\[.*?\\])/);\n        const targetStrMatch = input.match(/target = (-?\\d+)/);\n        if(!numsStrMatch || !targetStrMatch) return;\n        const nums = JSON.parse(numsStrMatch[1]);\n        const target = parseInt(targetStrMatch[1]);\n        const result = twoSum(nums, target);\n        console.log(JSON.stringify(result));\n    } catch(e) {}\n}\n\nmain();"}'::jsonb
),
(
    'Valid Parentheses',
    3,
    'Easy',
    'Given a string `s` containing just the characters `''(''`, `'')''`, `''{''`, `''}''`, `''[''` and `'']''`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, and in the correct order.',
    '[
        {"input": "s = \"()\"", "expected_output": "true"},
        {"input": "s = \"()[]{}\"", "expected_output": "true"},
        {"input": "s = \"(]\"", "expected_output": "false"}
    ]'::jsonb,
    '{"cpp":"#include <iostream>\n#include <string>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n        return false;\n    }\n};\n\nint main() {\n    string input;\n    if (!getline(cin, input)) return 0;\n    size_t quoteStart = input.find(''\"'');\n    size_t quoteEnd = input.rfind(''\"'');\n    string s = \"\";\n    if (quoteStart != string::npos && quoteEnd != string::npos && quoteStart < quoteEnd) {\n        s = input.substr(quoteStart + 1, quoteEnd - quoteStart - 1);\n    }\n    Solution sol;\n    bool result = sol.isValid(s);\n    cout << (result ? \"true\" : \"false\") << endl;\n    return 0;\n}","javascript":"const fs = require(''fs'');\n\nvar isValid = function(s) {\n    // Write your code here\n    return false;\n};\n\nfunction main() {\n    try {\n        const input = fs.readFileSync(''/dev/stdin'', ''utf-8'').trim();\n        if (!input) return;\n        const match = input.match(/s = \"(.*)\"/);\n        if(!match) return;\n        const s = match[1];\n        const result = isValid(s);\n        console.log(result ? \"true\" : \"false\");\n    } catch(e) {}\n}\n\nmain();"}'::jsonb
),
(
    'Container With Most Water',
    2,
    'Medium',
    'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `ith` line are `(i, 0)` and `(i, height[i])`. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
    '[
        {"input": "height = [1,8,6,2,5,4,8,3,7]", "expected_output": "49"},
        {"input": "height = [1,1]", "expected_output": "1"}
    ]'::jsonb,
    '{"cpp":"#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\n#include <algorithm>\n\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your code here\n        return 0;\n    }\n};\n\nint main() {\n    string input;\n    if (!getline(cin, input)) return 0;\n    size_t bracketStart = input.find(''['');\n    size_t bracketEnd = input.find('']'');\n    string arrayStr = input.substr(bracketStart + 1, bracketEnd - bracketStart - 1);\n    vector<int> height;\n    if (!arrayStr.empty()) {\n        stringstream ss(arrayStr);\n        string token;\n        while (getline(ss, token, '','')) {\n            height.push_back(stoi(token));\n        }\n    }\n    Solution sol;\n    int result = sol.maxArea(height);\n    cout << result << endl;\n    return 0;\n}","javascript":"const fs = require(''fs'');\n\nvar maxArea = function(height) {\n    // Write your code here\n    return 0;\n};\n\nfunction main() {\n    try {\n        const input = fs.readFileSync(''/dev/stdin'', ''utf-8'').trim();\n        if (!input) return;\n        const match = input.match(/height = (\\[.*?\\])/);\n        if(!match) return;\n        const height = JSON.parse(match[1]);\n        const result = maxArea(height);\n        console.log(result);\n    } catch(e) {}\n}\n\nmain();"}'::jsonb
);
