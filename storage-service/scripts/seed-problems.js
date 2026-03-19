const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coderomedb";

const SAMPLE_PROBLEMS = [
  {
    title: 'Two Sum',
    difficulty: 'easy',
    tags: ['array', 'hash-table'],
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] = 2 + 7 = 9
\`\`\`

**Constraints:**
- 2 <= nums.length <= 10^4
- -10^9 <= nums[i] <= 10^9`,
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isHidden: false },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', isHidden: false },
      { input: '2\n3 3\n6', expectedOutput: '0 1', isHidden: true },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode: `def two_sum(nums, target):
    # Your code here
    pass

import sys
data = sys.stdin.read().split()
n = int(data[0])
nums = list(map(int, data[1:n+1]))
target = int(data[n+1])
result = two_sum(nums, target)
print(*result)`,
      },
    ],
  },
  {
    title: 'Reverse a String',
    difficulty: 'easy',
    tags: ['string', 'two-pointers'],
    description: `## Reverse a String

Write a function that reverses a string. The input string is given as an array of characters.

You must do this by modifying the input array in-place with O(1) extra memory.

**Example:**
\`\`\`
Input: s = "hello"
Output: "olleh"
\`\`\``,
    testCases: [
      { input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { input: 'Hannah', expectedOutput: 'hannaH', isHidden: false },
      { input: 'a', expectedOutput: 'a', isHidden: true },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode: `s = input().strip()
# Reverse the string
print(s[::-1])`,
      },
    ],
  },
  {
    title: 'FizzBuzz',
    difficulty: 'easy',
    tags: ['math', 'string'],
    description: `## FizzBuzz

Given an integer \`n\`, return a string array where:
- \`answer[i] == "FizzBuzz"\` if i is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if i is divisible by 3.
- \`answer[i] == "Buzz"\` if i is divisible by 5.
- \`answer[i] == i\` (as a string) if none of the above conditions are true.

Print each value on a new line from 1 to n.

**Example (n=5):**
\`\`\`
1
2
Fizz
4
Buzz
\`\`\``,
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz', isHidden: false },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', isHidden: false },
    ],
    codeStubs: [
      {
        language: 'python3',
        starterCode: `n = int(input())
for i in range(1, n + 1):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)`,
      },
    ],
  },
  {
    title: 'Maximum Subarray',
    difficulty: 'medium',
    tags: ['array', 'dynamic-programming', 'divide-and-conquer'],
    description: `## Maximum Subarray

Given an integer array \`nums\`, find the subarray with the largest sum and return its sum.

**Example 1:**
\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

**Constraints:**
- 1 <= nums.length <= 10^5
- -10^4 <= nums[i] <= 10^4`,
    testCases: [
      { input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6', isHidden: false },
      { input: '1\n1', expectedOutput: '1', isHidden: false },
      { input: '5\n5 4 -1 7 8', expectedOutput: '23', isHidden: true },
    ],
  },
  {
    title: 'Valid Parentheses',
    difficulty: 'easy',
    tags: ['string', 'stack'],
    description: `## Valid Parentheses

Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

A string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example:**
\`\`\`
Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false
\`\`\``,
    testCases: [
      { input: '()[]{}\n', expectedOutput: 'true', isHidden: false },
      { input: '(]\n', expectedOutput: 'false', isHidden: false },
      { input: '{[]}\n', expectedOutput: 'true', isHidden: true },
    ],
  },
  {
    title: 'Merge Intervals',
    difficulty: 'medium',
    tags: ['array', 'sorting'],
    description: `## Merge Intervals

Given an array of intervals where \`intervals[i] = [starti, endi]\`, merge all overlapping intervals.

Return an array of the non-overlapping intervals that cover all the intervals in the input.

**Example:**
\`\`\`
Input: intervals = [[1,3],[2,6],[8,10],[15,18]]
Output: [[1,6],[8,10],[15,18]]
\`\`\``,
    testCases: [
      { input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18', isHidden: false },
      { input: '2\n1 4\n4 5', expectedOutput: '1 5', isHidden: false },
    ],
  },
];

async function seed() {
  try {
    console.log("Connecting to:", MONGODB_URI);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("Connected to MongoDB");

    const Problem = require("../src/models/Problem");
    console.log("Connection state:", mongoose.connection.readyState);

    const inserted = await Problem.insertMany(SAMPLE_PROBLEMS);
    console.log(`Seeded ${inserted.length} problems`);

    await mongoose.disconnect();
    console.log("Done!");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
