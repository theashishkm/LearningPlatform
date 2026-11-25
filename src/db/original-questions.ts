type Draft = { prompt: string; options: string[]; answer: string; explanation: string };
type Exercise = (n: number) => Draft;
const nat = (prompt: string, answer: number, explanation: string): Draft =>
  ({ prompt, options: [], answer: String(answer), explanation });
function mcq(prompt: string, answer: string, distractors: string[], explanation: string, n: number): Draft {
  const options = [...distractors];
  const index = n % (options.length + 1);
  options.splice(index, 0, answer);
  return { prompt, options, answer: "ABCD"[index], explanation };
}

const names = ["Asha", "Dev", "Farah", "Ishan", "Jaya", "Kiran", "Leela", "Maya", "Nikhil", "Omar"];
const places = ["library", "museum", "station", "clinic", "school"];
const location = (n: number) => [names[n % 10], places[Math.floor(n / 10) % 5]];
const noun = (n: number) => ["reports", "letters", "maps", "forms", "files"][Math.floor(n / 10) % 5];

const exercises: Record<string, Exercise[]> = {
  LA: [
    n => nat(`Find the determinant of [[${n}, 2], [3, 4]].`, 4*n-6, "For a 2 × 2 matrix the determinant is ad − bc."),
    n => nat(`How many free variables are in the null space of a ${n+5} × ${n+8} matrix of rank ${n+2}?`, 6, "Nullity is the number of columns minus the rank."),
    n => nat(`Find the largest eigenvalue of the upper triangular matrix [[${n}, 2, 1], [0, ${n+4}, 3], [0, 0, −2]].`, n+4, "A triangular matrix has its diagonal entries as eigenvalues."),
    n => nat(`A real 2 × 2 matrix has trace ${2*n+3} and determinant ${n*(n+3)}. Find the smaller eigenvalue.`, n, `The characteristic polynomial factors as (λ − ${n})(λ − ${n+3}).`),
    n => nat(`A square matrix A has eigenvalues ${n}, −2 and 3. Compute det(A² − I).`, 24*(n*n-1), "Apply λ² − 1 to each eigenvalue and multiply the results."),
  ],
  PROB: [
    n => nat(`A bag contains ${n+1} red balls and 4 green balls. What is the numerator of P(red) before reducing the fraction?`, n+1, "Count favorable outcomes over all balls."),
    n => nat(`Find the expected sum of two independent fair dice whose faces are numbered 1 through ${2*n+1}.`, 2*n+2, "Each die has mean (1 + number of faces)/2. Add the means."),
    n => nat(`A group of ${n+4} students must choose two distinct representatives with no assigned roles. How many selections are possible?`, (n+4)*(n+3)/2, "Count ordered pairs, then divide by two."),
    n => nat(`If X has variance ${n} and Y has variance 9 with covariance 2, find Var(2X − Y).`, 4*n+1, "Use 4 Var(X) + Var(Y) − 4 Cov(X,Y)."),
    n => nat(`Of the people screened, ${5*n} have a condition. The test detects 80% of them and gives exactly ${80*n} false positives. Of all positive results, what percentage is true positive? Round to one decimal place.`, 4.8, "There are 4n true positives and 84n total positives. Multiply their ratio by 100 and round."),
  ],
  CALC: [
    n => nat(`Evaluate the derivative of f(x) = ${n}x² + 3x at x = 2.`, 4*n+3, "Differentiate to get 2nx + 3, then substitute x = 2."),
    n => nat(`For f(x) = x² − ${2*n}x + 1, find the x-coordinate of the minimum.`, n, "The derivative is zero at x = n and the second derivative is positive."),
    n => nat(`Find the integral of 2x + ${n} from x = 0 to x = 3.`, 9+3*n, "An antiderivative is x² + nx."),
    n => nat(`Find the minimum of x² + y² subject to x + y = ${2*n}.`, 2*n*n, "Substitute y = 2n − x. Completing the square puts the minimum at x = y = n."),
    n => nat(`For f(x,y) = ${n+2}x² + 4xy + 3y², find the determinant of the Hessian.`, 12*(n+2)-16, "The Hessian diagonal is 2(n+2), 6 and both off-diagonal entries are 4."),
  ],
  APT: [
    n => nat(`A ${100*n} rupee item is discounted by 15%. What is the final price in rupees?`, 85*n, "Multiply the original price by 0.85."),
    n => nat(`Two numbers are in the ratio 7:4 and their sum is ${11*n}. What is the difference?`, 3*n, "One ratio unit is the sum divided by 11."),
    n => nat(`A cyclist travels ${60*n} km at 30 km/h and returns the same distance at 20 km/h. What is the average speed in km/h?`, 24, "Use total distance divided by total time, giving the harmonic mean of the two speeds."),
    n => nat(`Worker A takes ${6*n} days and worker B takes ${3*n} days to finish a job alone. How many days do they take together?`, 2*n, "Add rates 1/(6n) and 1/(3n), then take the reciprocal."),
    n => nat(`A tank starts with ${40*n} litres of pure water. Remove one quarter and replace it with syrup, then repeat. How many litres of water remain?`, 22.5*n, "Multiply the starting water volume by 3/4 twice."),
  ],
  PYDSA: [
    n => nat(`What does Python's len(range(2, ${3*n+2}, 3)) return?`, n, "The exclusive stop is three times n beyond the starting value."),
    n => nat(`A zero-indexed array has length ${2*n+1}. What index does binary search inspect first using (low + high) // 2?`, n, "Initially low is 0 and high is length minus one."),
    n => nat(`An undirected tree has ${n+8} vertices. How many edges does it have?`, n+7, "A tree has one fewer edge than vertices."),
    n => nat(`How many times does Python execute the body of for i in range(${n+1}): for j in range(i): ... ?`, n*(n+1)/2, "Sum the inner-loop lengths from 0 through n."),
    n => nat(`A full binary tree has ${n+9} leaves. How many nodes does it have in total?`, 2*(n+9)-1, "A full binary tree has one fewer internal node than leaves."),
  ],
  DBMS: [
    n => nat(`A database table contains ${n+10} rows; ${n} have NULL in column amount. What does SELECT COUNT(amount) return?`, 10, "COUNT(column) excludes NULL values."),
    n => nat(`Table A has ${n+2} rows and B has 6 rows. How many rows are in their CROSS JOIN?`, 6*(n+2), "A cross join pairs every A row with every B row."),
    n => nat(`An INNER JOIN matches ${n} rows of A to exactly three rows each in B. Other A rows have no match. How many rows are returned?`, 3*n, "The result contains one output row for every matching pair."),
    n => nat(`A warehouse stores one row for each of ${n+2} stores, 12 months and four categories. How many rows remain after grouping only by store and category?`, 4*(n+2), "The rollup collapses months into one row per store and category."),
    n => nat(`On a relation with ${n+7} tuples, A is a key and B has exactly 7 distinct values. How many rows does SELECT DISTINCT A, B return?`, n+7, "Each A value is distinct, so every pair is distinct regardless of B."),
  ],
  ML: [
    n => nat(`A classifier correctly predicts ${3*n} of ${4*n} examples. What is its accuracy as a percentage?`, 75, "Accuracy is correct predictions divided by all predictions."),
    n => nat(`For actual values 0, 4 and predictions ${n}, ${n+4}, what is the mean squared error?`, n*n, "Both errors have magnitude n, so their mean squared error is n²."),
    n => nat(`A detector finds ${4*n} of ${5*n} positives and flags ${n} negatives. What is its recall as a percentage?`, 80, "Recall divides true positives by all actual positives."),
    n => nat(`For squared loss L(w) = (w − ${n})², start at w = 0 and use learning rate 0.25. What is w after one gradient step?`, n/2, "The gradient at zero is −2n. Subtract one quarter of that gradient."),
    n => nat(`A k-means cluster contains ${n} copies of (2, 2) and ${3*n} copies of (10, 6). Compute the x-coordinate of its updated centroid.`, 8, "Use the weighted arithmetic mean of the x-coordinates."),
  ],
  AI: [
    n => nat(`Breadth-first search expands a perfect binary tree whose leaves are at depth ${n+1}. How many nodes are at depth ${n} when the root is at depth 0?`, 2**n, "Each successive depth doubles the number of nodes."),
    n => nat(`Uniform-cost search compares frontier paths costing ${n+3}, ${n}, and ${n+2}. What cost is expanded first?`, n, "Uniform-cost search expands the frontier node with minimum path cost."),
    n => nat(`A node has path cost ${n+4} and heuristic ${n+1}. What is its A* priority f?`, 2*n+5, "A* evaluates f = g + h."),
    n => nat(`A MAX node has two MIN children with respective terminal utilities [${n+1}, ${n+6}] and [${n+3}, ${n+4}]. What is the minimax value of the root?`, n+3, "Take each pair's minimum and then the larger of the two minima."),
    n => nat(`For consistency on an edge of cost 6 from u to v, with h(v) = ${n}, what is the greatest integer allowed for h(u) by this edge?`, n+6, "Consistency requires h(u) ≤ cost(u,v) + h(v)."),
  ],
  "ENG-G": [
    n => { const [p,l] = location(n); return mcq(`${p} ___ to the ${l} every Tuesday.`, "goes", ["go", "gone", "going"], "A singular third-person subject takes goes in the simple present.", n); },
    n => { const [p,l] = location(n); return mcq(`${p} took the ${noun(n)} from home and delivered them ___ the ${l}, their final destination.`, "to", ["of", "during", "despite"], "Use deliver something to a destination.", n); },
    n => { const [p,l] = location(n); return mcq(`What is “after the ${l} closed” in “${p} called after the ${l} closed”?`, "An adverbial clause", ["A noun clause", "An adjective clause", "An independent clause"], "It has a subject and verb and tells when the call took place.", n); },
    n => { const [p,l] = location(n); return mcq(`By the time ${p} reached the ${l}, the guard ___ locked the door.`, "had", ["has", "will have", "would have"], "The past perfect marks the earlier of the two past events.", n); },
    n => { const [p,l] = location(n); return mcq(`Only after ${p} left the ${l} ___ the manager notice the error.`, "did", ["had", "was", "has"], "An initial only-after phrase triggers inversion. Use did with the base verb notice.", n); },
  ],
  "ENG-V": [
    n => { const [p,l] = location(n); return mcq(`At the ${l}, ${p} gave a concise explanation in two sentences. What does concise mean here?`, "Brief and clear", ["Loud and forceful", "Detailed and lengthy", "Vague and confusing"], "The two-sentence explanation uses few words while conveying its point.", n); },
    n => { const [p,l] = location(n); return mcq(`${p} found the ${l}'s directions ambiguous because they suggested two different routes. What does ambiguous mean?`, "Open to more than one interpretation", ["Impossible to read", "Rude in tone", "Correct in every detail"], "The directions support two interpretations.", n); },
    n => { const [p,l] = location(n); return mcq(`${p} used a temporary sign at the ${l} to mitigate confusion. Which word is closest to mitigate?`, "Reduce", ["Ignore", "Confirm", "Increase"], "The sign lessens the confusion.", n); },
    n => { const [p,l] = location(n); return mcq(`${p} offered receipts to corroborate the ${l}'s account. What does corroborate mean?`, "Confirm with supporting evidence", ["Replace with a new account", "Conceal from others", "Summarize in fewer words"], "The receipts serve as independent evidence.", n); },
    n => { const [p,l] = location(n); return mcq(`The ${l} manager gave ${p} an equivocal reply, leaving it unclear whether permission had been granted. What does equivocal mean?`, "Unclear or deliberately noncommittal", ["Firmly approving", "Highly detailed", "Openly hostile"], "The reply avoids a clear commitment.", n); },
  ],
  "ENG-R": [
    n => { const [p,l] = location(n); return mcq(`Passage: The ${l} closes at six on Fridays. ${p} arrived at seven. Why could the visit not go ahead as planned?`, "The venue had closed", ["The venue had moved", "It was the wrong day", "The visit was too early"], "Seven is after the stated closing time of six.", n); },
    n => { const [p,l] = location(n); return mcq(`Passage: ${p} wanted to visit the ${l} on foot, but flooding blocked the bridge. A free bus used another route. What led to the change of transport?`, "The walking route was blocked", ["The bus was cancelled", "The destination changed", "The bridge charged a toll"], "The passage identifies the flood as the obstacle.", n); },
    n => { const [p,l] = location(n); return mcq(`Passage: After the ${l} extended its hours, ${p} noticed more evening visits and fewer midday visits. No total was reported. Which conclusion is supported?`, "Visits shifted toward the evening", ["Total visits doubled", "Evenings became less popular", "Visitors spent more per visit"], "The report compares time slots and provides no overall total.", n); },
    n => { const [p,l] = location(n); return mcq(`Passage: ${p} surveyed only people leaving the ${l} and concluded that everyone in town liked its new hours. What weakens the conclusion?`, "The sample excludes people who did not visit", ["The survey happened outside", "The town has a venue", "The hours changed"], "The sample can miss people discouraged by the schedule.", n); },
    n => { const [p,l] = location(n); return mcq(`Passage: Attendance at the ${l} rose after ${p} lowered prices. A festival began the same week. What evidence would best separate the two explanations?`, "Attendance at a similar venue exposed to the festival but with unchanged prices", ["A list of festival performers", "The age of the venue", "The font on the price sign"], "A comparison venue helps distinguish the festival effect from the price effect.", n); },
  ],
  "ENG-W": [
    n => { const [p,l] = location(n); return mcq(`Which email subject most clearly tells ${p} the purpose of a message about changing a visit to the ${l}?`, "Request to reschedule the visit", ["Hello", "An update", "Please read"], "The subject names both the action and the event.", n); },
    n => { const [p,l] = location(n); return mcq(`Which revision makes the request to ${p} at the ${l} easiest to act on?`, "Please send the signed form by 3 p.m. on Friday.", ["Send it soon.", "The form would be nice.", "Handle the matter at your convenience."], "A specific item and deadline tell the reader what to do and when.", n); },
    n => { const [p,l] = location(n); return mcq(`Combine these sentences using a transition that signals cause and effect: “The ${l} was closed. ${p} postponed the visit.”`, `The ${l} was closed, so ${p} postponed the visit.`, [`The ${l} was closed, yet ${p} postponed the visit.`, `The ${l} was closed, although ${p} postponed the visit.`, `The ${l} was closed, whereas ${p} postponed the visit.`], "So introduces the consequence of the closure.", n); },
    n => { const [p,l] = location(n); return mcq(`Write for readers who have never visited the ${l}. Which first sentence gives enough context for ${p}'s paragraph on signs?`, `First-time visitors to the ${l} need clearer directions from the entrance to reception.`, ["These are still a problem.", "It needs changing.", "As I said, it is confusing."], "The opening identifies the audience, location and issue without a vague pronoun.", n); },
    n => { const [p,l] = location(n); return mcq(`${p}'s report says that complaints about the ${l} fell from 40 to 20 after signs were replaced. Which conclusion is most precise?`, "Recorded complaints halved after the signs were replaced.", ["The signs eliminated confusion.", "The signs definitely caused all of the decline.", "Everyone liked the new signs."], "The observation supports the change in the count and its timing. It does not establish the sole cause.", n); },
  ],
};

const difficulties = ["Easy", "Easy", "Medium", "Medium", "Hard"] as const;

export function buildOriginalBank() {
  return Object.entries(exercises).flatMap(([subject, families]) =>
    families.flatMap((create, family) =>
      Array.from({ length: 40 }, (_, index) => {
        const n = index + 2;
        const draft = create(n);
        return {
          ...draft, subject, id: `ORIGINAL-V1-${subject}-${family + 1}-${n}`,
          kind: draft.options.length ? "MCQ" : "NAT",
          difficulty: difficulties[family],
          origin: "original" as const,
          source: "Learning Hub original practice",
        };
      }),
    ),
  );
}
