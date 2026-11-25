const paper = "https://gate2026.iitg.ac.in/doc/download/2026/QPs/DA.pdf";
const key = "https://gate2026.iitg.ac.in/doc/download/2026/Keys/DA_Keys.pdf";

const gateQuestions = [
  {
    number: 18, page: 12, subject: "DBMS", difficulty: "Easy",
    prompt: "An OLAP cube displays sales quantity by product type, month and country. Which operation replaces country with the more detailed state level?",
    options: ["Slicing", "Dicing", "Roll-up", "Drill-down"], answer: "D",
    explanation: "Moving from country to state refines the geography hierarchy. That is a drill-down.",
  },
  {
    number: 19, page: 13, subject: "PROB", difficulty: "Hard",
    prompt: "Choose a nonempty subset of {1, …, 2026} uniformly. What is the probability that its element product is even?",
    options: ["2^1013(2^1013 − 1)/2^2026", "2^1013/2^2026", "2^1013(2^1013 − 1)/(2^2026 − 1)", "1/(2^2026 − 1)"],
    answer: "C",
    explanation: "Choose a nonempty subset of the 1013 evens and any subset of the 1013 odds. Divide their product count by the number of nonempty subsets.",
  },
  {
    number: 21, page: 14, subject: "LA", difficulty: "Medium",
    prompt: "Let M be the 2 × 2 matrix that rotates a vector counterclockwise by 2π/5. Which matrix equals M^2026?",
    options: ["M²", "M", "M⁻¹", "The 2 × 2 identity"], answer: "B",
    explanation: "Five applications make one full turn. Since 2026 leaves remainder one upon division by five, the result is M.",
  },
  {
    number: 22, page: 14, subject: "LA", difficulty: "Medium",
    prompt: "Intersect the closed ball of radius 4 centered at the origin in ℝ³ with any two-dimensional linear subspace. What is the area of the intersection?",
    options: ["16π", "4π", "4π²", "16π²"], answer: "A",
    explanation: "A linear subspace passes through the origin, giving a disk of radius 4. Its area is π times the square of the radius.",
  },
].map(({ number, page, ...item }) => ({
  ...item,
  id: `PYQ-GATE-2026-DA-${number}`,
  kind: "MCQ",
  origin: "pyq" as const,
  source: "GATE 2026 DA",
  sourceYear: 2026,
  sourceUrl: `${paper}#page=${page}`,
  sourceQuestionRef: `Q${number}`,
  answerKeyUrl: key,
}));

const cmiQuestions = [
  {
    number: 1, subject: "PROB", difficulty: "Medium",
    prompt: "Count injective and surjective functions from a three-element set to a four-element set. Select every statement that holds.",
    options: ["There are 81 injective functions.", "The two counts are equal.", "The surjection count is smaller.", "The injection count is 24."],
    answer: ["C", "D"],
    explanation: "There are 4 × 3 × 2 injective assignments. A domain of size three cannot cover a codomain of size four.",
  },
  {
    number: 2, subject: "PYDSA", difficulty: "Medium",
    prompt: "An algorithm examines every array index pair i < j and adds one to its result whenever A[i] exceeds twice A[j]. Select all true claims.",
    options: ["The result counts pairs with i < j and A[i] > 2A[j].", "Its result for [1, −4, 3, −5, −2] is 7.", "Its result for [1, 2, 3, 4, 5] is 0.", "Its result for [10, 5, 1] is 2."],
    answer: ["A", "C", "D"],
    explanation: "The three example counts are 6, 0 and 2. In the last example, strict inequality excludes the pair (10, 5).",
  },
].map(({ number, ...item }) => ({
  ...item,
  id: `PYQ-CMI-2025-MSCDS-A-${number}`,
  kind: "MSQ",
  origin: "pyq" as const,
  source: "CMI 2025 MSc Data Science",
  sourceYear: 2025,
  sourceUrl: "https://www.cmi.ac.in/admissions/sample-qp/mscds2025.pdf",
  sourceQuestionRef: `Part A Q${number}`,
  answerKeyUrl: "https://www.cmi.ac.in/admissions/sample-qp/mscds2025-solutions.pdf",
}));

export const verifiedQuestions = [...gateQuestions, ...cmiQuestions];
