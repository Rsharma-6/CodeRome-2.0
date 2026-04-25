const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../storage-service/.env') });
// Must use the same mongoose instance that Problem model is registered on
const mongoose = require('../storage-service/node_modules/mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coderomedb';

// ─── PROBLEMS ─────────────────────────────────────────────────────────────────

const PROBLEMS = [

  // ── 1. Two Sum ──────────────────────────────────────────────────────────────
  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return *indices* of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Return the answer in ascending order of indices.

**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\`

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- Only one valid answer exists.`,
    testCases: [
      { input: '4\n2 7 11 15\n9',  expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6',      expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6',        expectedOutput: '0 1', isHidden: false },
      { input: '4\n1 2 3 4\n7',    expectedOutput: '2 3', isHidden: true  },
      { input: '3\n-1 -2 -3\n-5', expectedOutput: '1 2', isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Your code here
        pass`,
        driverCode:
`import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
sol = Solution()
result = sol.twoSum(nums, target)
print(*result)`,
      },
      {
        language: 'java',
        starterCode:
`import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your code here
        return new int[]{};
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        Solution sol = new Solution();
        int[] result = sol.twoSum(nums, target);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < result.length; i++) {
            if (i > 0) sb.append(" ");
            sb.append(result[i]);
        }
        System.out.println(sb);
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Your code here
        return {};
    }
};`,
        driverCode:
`int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    int target;
    cin >> target;
    Solution sol;
    vector<int> result = sol.twoSum(nums, target);
    for (int i = 0; i < (int)result.size(); i++) {
        if (i > 0) cout << " ";
        cout << result[i];
    }
    cout << endl;
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>
#include <stdlib.h>

/* Note: The returned array must be malloc'd. returnSize will be set to 2. */
int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    // Your code here
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    return result;
}`,
        driverCode:
`int main() {
    int n;
    scanf("%d", &n);
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    int target;
    scanf("%d", &target);
    int returnSize = 0;
    int* result = twoSum(nums, n, target, &returnSize);
    for (int i = 0; i < returnSize; i++) {
        if (i > 0) printf(" ");
        printf("%d", result[i]);
    }
    printf("\\n");
    free(nums);
    free(result);
    return 0;
}`,
      },
    ],
  },

  // ── 2. Reverse a String ─────────────────────────────────────────────────────
  {
    title: 'Reverse a String',
    difficulty: 'easy',
    tags: ['string', 'two-pointers'],
    description: `## Reverse a String

Write a function that reverses a string and returns it.

**Example 1:**
\`\`\`
Input: s = "hello"
Output: "olleh"
\`\`\`

**Example 2:**
\`\`\`
Input: s = "racecar"
Output: "racecar"
\`\`\`

**Constraints:**
- \`1 <= s.length <= 10^5\`
- \`s\` consists of printable ASCII characters.`,
    testCases: [
      { input: 'hello',   expectedOutput: 'olleh',   isHidden: false },
      { input: 'abcde',   expectedOutput: 'edcba',   isHidden: false },
      { input: 'racecar', expectedOutput: 'racecar', isHidden: false },
      { input: 'OpenAI',  expectedOutput: 'IAnepO',  isHidden: true  },
      { input: 'a',       expectedOutput: 'a',       isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`class Solution:
    def reverseString(self, s: str) -> str:
        # Your code here
        pass`,
        driverCode:
`s = input().strip()
sol = Solution()
print(sol.reverseString(s))`,
      },
      {
        language: 'java',
        starterCode:
`class Solution {
    public String reverseString(String s) {
        // Your code here
        return "";
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String s = sc.nextLine().strip();
        Solution sol = new Solution();
        System.out.println(sol.reverseString(s));
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    string reverseString(string s) {
        // Your code here
        return "";
    }
};`,
        driverCode:
`int main() {
    string s;
    getline(cin, s);
    Solution sol;
    cout << sol.reverseString(s) << endl;
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>
#include <string.h>
#include <stdlib.h>

/* Returns a newly allocated reversed string. Caller must free. */
char* reverseString(const char* s) {
    // Your code here
    int len = strlen(s);
    char* result = (char*)malloc((len + 1) * sizeof(char));
    result[len] = '\\0';
    return result;
}`,
        driverCode:
`int main() {
    char s[100001];
    fgets(s, sizeof(s), stdin);
    int len = strlen(s);
    if (len > 0 && s[len - 1] == '\\n') s[len - 1] = '\\0';
    char* result = reverseString(s);
    printf("%s\\n", result);
    free(result);
    return 0;
}`,
      },
    ],
  },

  // ── 3. FizzBuzz ─────────────────────────────────────────────────────────────
  {
    title: 'FizzBuzz',
    difficulty: 'easy',
    tags: ['math', 'string', 'simulation'],
    description: `## FizzBuzz

Given an integer \`n\`, print numbers from \`1\` to \`n\` (one per line) with these rules:
- Print \`"FizzBuzz"\` if divisible by both 3 and 5.
- Print \`"Fizz"\` if divisible by 3 only.
- Print \`"Buzz"\` if divisible by 5 only.
- Print the number itself otherwise.

**Example (n = 5):**
\`\`\`
1
2
Fizz
4
Buzz
\`\`\`

**Constraints:**
- \`1 <= n <= 10^4\``,
    testCases: [
      { input: '5',  expectedOutput: '1\n2\nFizz\n4\nBuzz',                                                                                        isHidden: false },
      { input: '3',  expectedOutput: '1\n2\nFizz',                                                                                                  isHidden: false },
      { input: '1',  expectedOutput: '1',                                                                                                            isHidden: false },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz',                                    isHidden: true  },
      { input: '20', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz',            isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`from typing import List

class Solution:
    def fizzBuzz(self, n: int) -> List[str]:
        # Your code here
        pass`,
        driverCode:
`n = int(input())
sol = Solution()
result = sol.fizzBuzz(n)
for item in result:
    print(item)`,
      },
      {
        language: 'java',
        starterCode:
`import java.util.*;

class Solution {
    public List<String> fizzBuzz(int n) {
        // Your code here
        return new ArrayList<>();
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        Solution sol = new Solution();
        java.util.List<String> result = sol.fizzBuzz(n);
        for (String s : result) System.out.println(s);
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<string> fizzBuzz(int n) {
        // Your code here
        return {};
    }
};`,
        driverCode:
`int main() {
    int n;
    cin >> n;
    Solution sol;
    vector<string> result = sol.fizzBuzz(n);
    for (const string& s : result) cout << s << "\\n";
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>

/* Print FizzBuzz output for 1..n, one value per line. */
void fizzBuzz(int n) {
    // Your code here
}`,
        driverCode:
`int main() {
    int n;
    scanf("%d", &n);
    fizzBuzz(n);
    return 0;
}`,
      },
    ],
  },

  // ── 4. Maximum Subarray ─────────────────────────────────────────────────────
  {
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the **subarray** with the largest sum and return its sum.

**Example 1:**
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum = 6.
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [1]
Output: 1
\`\`\`

**Constraints:**
- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\``,
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6',  isHidden: false },
      { input: '1\n1',                       expectedOutput: '1',  isHidden: false },
      { input: '5\n5 4 -1 7 8',             expectedOutput: '23', isHidden: false },
      { input: '6\n-2 -3 4 -1 -2 1',        expectedOutput: '4',  isHidden: true  },
      { input: '4\n-1 -2 -3 -4',            expectedOutput: '-1', isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`from typing import List

class Solution:
    def maxSubArray(self, nums: List[int]) -> int:
        # Your code here
        pass`,
        driverCode:
`import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
sol = Solution()
print(sol.maxSubArray(nums))`,
      },
      {
        language: 'java',
        starterCode:
`class Solution {
    public int maxSubArray(int[] nums) {
        // Your code here
        return 0;
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        Solution sol = new Solution();
        System.out.println(sol.maxSubArray(nums));
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        // Your code here
        return 0;
    }
};`,
        driverCode:
`int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    Solution sol;
    cout << sol.maxSubArray(nums) << endl;
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>

int maxSubArray(int* nums, int numsSize) {
    // Your code here
    return 0;
}`,
        driverCode:
`#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);
    int* nums = (int*)malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) scanf("%d", &nums[i]);
    printf("%d\\n", maxSubArray(nums, n));
    free(nums);
    return 0;
}`,
      },
    ],
  },

  // ── 5. Valid Parentheses ─────────────────────────────────────────────────────
  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['string', 'stack'],
    description: `## Valid Parentheses

Given a string \`s\` containing only \`(\`, \`)\`, \`{\`, \`}\`, \`[\`, \`]\`, determine if the input string is valid.

A string is valid if:
1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket.

**Example 1:**
\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

**Example 2:**
\`\`\`
Input: s = "(]"
Output: false
\`\`\`

**Constraints:**
- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses only \`()[]{}\`.`,
    testCases: [
      { input: '()[]{}', expectedOutput: 'true',  isHidden: false },
      { input: '(]',     expectedOutput: 'false', isHidden: false },
      { input: '{[]}',   expectedOutput: 'true',  isHidden: false },
      { input: '([)]',   expectedOutput: 'false', isHidden: true  },
      { input: '((((',   expectedOutput: 'false', isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`class Solution:
    def isValid(self, s: str) -> bool:
        # Your code here
        pass`,
        driverCode:
`s = input().strip()
sol = Solution()
print(str(sol.isValid(s)).lower())`,
      },
      {
        language: 'java',
        starterCode:
`class Solution {
    public boolean isValid(String s) {
        // Your code here
        return false;
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        String s = sc.nextLine().strip();
        Solution sol = new Solution();
        System.out.println(sol.isValid(s));
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        // Your code here
        return false;
    }
};`,
        driverCode:
`int main() {
    string s;
    cin >> s;
    Solution sol;
    cout << (sol.isValid(s) ? "true" : "false") << endl;
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>
#include <string.h>
#include <stdbool.h>

bool isValid(char* s) {
    // Your code here
    return false;
}`,
        driverCode:
`int main() {
    char s[10001];
    scanf("%s", s);
    printf("%s\\n", isValid(s) ? "true" : "false");
    return 0;
}`,
      },
    ],
  },

  // ── 6. Merge Intervals ───────────────────────────────────────────────────────
  {
    title: 'Merge Intervals',
    difficulty: 'medium',
    tags: ['array', 'sorting'],
    description: `## Merge Intervals

Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals and return an array of the non-overlapping intervals.

**Example 1:**
\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
Explanation: [1,3] and [2,6] overlap → merged to [1,6].
\`\`\`

**Example 2:**
\`\`\`
Input: intervals = [[1,4],[4,5]]
Output: [[1,5]]
\`\`\`

**Constraints:**
- \`1 <= intervals.length <= 10^4\`
- \`intervals[i].length == 2\`
- \`0 <= start_i <= end_i <= 10^4\``,
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18',    expectedOutput: '1 6\n8 10\n15 18', isHidden: false },
      { input: '2\n1 4\n4 5',                  expectedOutput: '1 5',              isHidden: false },
      { input: '3\n1 2\n3 4\n5 6',             expectedOutput: '1 2\n3 4\n5 6',   isHidden: false },
      { input: '4\n1 4\n2 3\n3 5\n6 8',        expectedOutput: '1 5\n6 8',        isHidden: true  },
      { input: '1\n1 1',                        expectedOutput: '1 1',             isHidden: true  },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode:
`from typing import List

class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        # Your code here
        pass`,
        driverCode:
`import sys
lines = [l for l in sys.stdin.read().splitlines() if l.strip()]
n = int(lines[0])
intervals = []
for i in range(1, n + 1):
    a, b = map(int, lines[i].split())
    intervals.append([a, b])
sol = Solution()
result = sol.merge(intervals)
for interval in result:
    print(interval[0], interval[1])`,
      },
      {
        language: 'java',
        starterCode:
`import java.util.*;

class Solution {
    public int[][] merge(int[][] intervals) {
        // Your code here
        return new int[][]{};
    }
}`,
        driverCode:
`public class Main {
    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        int n = sc.nextInt();
        int[][] intervals = new int[n][2];
        for (int i = 0; i < n; i++) {
            intervals[i][0] = sc.nextInt();
            intervals[i][1] = sc.nextInt();
        }
        Solution sol = new Solution();
        int[][] result = sol.merge(intervals);
        for (int[] iv : result) {
            System.out.println(iv[0] + " " + iv[1]);
        }
    }
}`,
      },
      {
        language: 'cpp',
        starterCode:
`#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        // Your code here
        return {};
    }
};`,
        driverCode:
`int main() {
    int n;
    cin >> n;
    vector<vector<int>> intervals(n, vector<int>(2));
    for (int i = 0; i < n; i++) cin >> intervals[i][0] >> intervals[i][1];
    Solution sol;
    vector<vector<int>> result = sol.merge(intervals);
    for (auto& iv : result) cout << iv[0] << " " << iv[1] << "\\n";
    return 0;
}`,
      },
      {
        language: 'c',
        starterCode:
`#include <stdio.h>
#include <stdlib.h>

/*
 * intervals: n x 2 array (intervals[i][0] = start, intervals[i][1] = end)
 * returnSize: set to the number of merged intervals
 * Returns a newly allocated n x 2 array. Caller must free each row then the array.
 */
int** merge(int** intervals, int n, int* returnSize) {
    // Your code here
    *returnSize = 0;
    return NULL;
}`,
        driverCode:
`int main() {
    int n;
    scanf("%d", &n);
    int** intervals = (int**)malloc(n * sizeof(int*));
    for (int i = 0; i < n; i++) {
        intervals[i] = (int*)malloc(2 * sizeof(int));
        scanf("%d %d", &intervals[i][0], &intervals[i][1]);
    }
    int returnSize = 0;
    int** result = merge(intervals, n, &returnSize);
    for (int i = 0; i < returnSize; i++) {
        printf("%d %d\\n", result[i][0], result[i][1]);
        free(result[i]);
    }
    free(result);
    for (int i = 0; i < n; i++) free(intervals[i]);
    free(intervals);
    return 0;
}`,
      },
    ],
  },

];

// ─── SEED ─────────────────────────────────────────────────────────────────────

async function seed() {
  const Problem = require('../storage-service/src/models/Problem');

  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const ops = PROBLEMS.map(p => ({
      updateOne: {
        filter: { title: p.title },
        update: { $set: p },
        upsert: true,
      },
    }));

    const result = await Problem.bulkWrite(ops);
    console.log(`Upserted: ${result.upsertedCount}  Updated: ${result.modifiedCount}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
