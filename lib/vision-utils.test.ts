import { isVisionModelByName } from './vision-utils';

// Test cases for vision model detection
const testCases = [
  { name: 'llava', expected: true },
  { name: 'llava:7b', expected: true },
  { name: 'bakllava', expected: true },
  { name: 'qwen-vl', expected: true },
  { name: 'qwen-vl-chat', expected: true },
  { name: 'gemini', expected: true },
  { name: 'claude-3', expected: true },
  { name: 'gpt-4v', expected: true },
  { name: 'gpt4-vision', expected: true },
  { name: 'llama-vision', expected: true },
  { name: 'llama2-vision', expected: true },
  { name: 'codellama-vision', expected: true },
  { name: 'phi-vision', expected: true },
  { name: 'phi3-vision', expected: true },
  { name: 'mistral-vision', expected: true },
  { name: 'mixtral-vision', expected: true },
  { name: 'yi-vision', expected: true },
  { name: 'deepseek-vision', expected: true },
  { name: 'chatglm-vision', expected: true },
  { name: 'internlm-vision', expected: true },
  { name: 'cogvlm', expected: true },
  { name: 'minicpm-vision', expected: true },
  { name: 'openflamingo', expected: true },
  { name: 'idefics', expected: true },
  { name: 'llama2', expected: false },
  { name: 'mistral', expected: false },
  { name: 'phi3', expected: false },
  { name: 'qwen', expected: false },
  { name: 'gemma', expected: false },
  { name: 'codellama', expected: false },
];

console.log('Testing vision model detection...');

testCases.forEach(({ name, expected }) => {
  const result = isVisionModelByName(name);
  const status = result === expected ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name} -> ${result} (expected: ${expected})`);
});

console.log('\nVision model detection test completed!'); 
