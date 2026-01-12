import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const operationSymbols = {
  add: "+",
  subtract: "-",
  multiply: "×",
  divide: "÷",
};

export async function computeWithLLM(
  numberA: number,
  numberB: number,
  operation: "add" | "subtract" | "multiply" | "divide"
): Promise<number> {
  const prompt = `Calculate ${numberA} ${operationSymbols[operation]} ${numberB}. Return ONLY the number.`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
    temperature: 0,
    max_tokens: 50,
  });

  const response = completion.choices[0]?.message?.content?.trim() || "";

  if (response.includes("ERROR") || response.includes("Division by zero")) {
    throw new Error("Division by zero");
  }

  const numberMatch = response.match(/-?\d+\.?\d*/);
  if (!numberMatch) {
    throw new Error(`Invalid LLM response: ${response}`);
  }

  const result = parseFloat(numberMatch[0]);
  if (isNaN(result)) {
    throw new Error(`Could not parse result: ${response}`);
  }

  return result;
}
