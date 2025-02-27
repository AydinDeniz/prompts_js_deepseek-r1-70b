// formula-evaluator.js
class FormulaEvaluator {
  constructor(variables = {}) {
    this.variables = variables;
    this.allowedOperations = {
      '+': (a, b) => a + b,
      '-': (a, b) => a - b,
      '*': (a, b) => a * b,
      '/': (a, b) => b !== 0 ? a / b : Infinity,
      '^': (a, b) => Math.pow(a, b)
    };
  }

  evaluate(formula) {
    try {
      const tokens = this.tokenize(formula);
      const outputQueue = this.shuntingYard(tokens);
      const result = this.calculate(outputQueue);
      return {
        result,
        error: null
      };
    } catch (error) {
      return {
        result: null,
        error: error.message
      };
    }
  }

  tokenize(formula) {
    const tokens = [];
    const numberPattern = /(\d+\.?\d*)([eE][+-]?\d+)?/g;
    const variablePattern = /[a-zA-Z_][a-zA-Z0-9_]*(?=[^a-zA-Z0-9_])/g;
    const operatorPattern = /[+\-*/^()]/g;

    let match;
    while ((match = numberPattern.exec(formula)) || (match = variablePattern.exec(formula)) || (match = operatorPattern.exec(formula))) {
      if (match[0] === ' ') continue;
      tokens.push(match[0]);
    }

    return tokens;
  }

  shuntingYard(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    const precedence = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '^': 3
    };

    for (const token of tokens) {
      if (!isNaN(token) || this.variables[token] !== undefined) {
        outputQueue.push(token);
      } else if (token === '(') {
        operatorStack.push(token);
      } else if (token === ')') {
        while (operatorStack[operatorStack.length - 1] !== '(') {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.pop();
      } else if (this.allowedOperations[token]) {
        while (operatorStack.length > 0 &&
               operatorStack[operatorStack.length - 1] !== '(' &&
               precedence[token] <= precedence[operatorStack[operatorStack.length - 1]]) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push(token);
      } else {
        throw new Error(`Invalid operator: ${token}`);
      }
    }

    while (operatorStack.length > 0) {
      outputQueue.push(operatorStack.pop());
    }

    return outputQueue;
  }

  calculate(outputQueue) {
    const stack = [];
    for (const token of outputQueue) {
      if (!isNaN(token) || this.variables[token] !== undefined) {
        stack.push(isNaN(token) ? this.variables[token] : parseFloat(token));
      } else if (this.allowedOperations[token]) {
        if (stack.length < 2) {
          throw new Error('Not enough operands for operator');
        }
        const b = stack.pop();
        const a = stack.pop();
        const result = this.allowedOperations[token](a, b);
        stack.push(result);
      } else {
        throw new Error(`Unknown operator: ${token}`);
      }
    }
    return stack.pop();
  }

  addVariable(name, value) {
    this.variables[name] = value;
  }

  removeVariable(name) {
    delete this.variables[name];
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const evaluator = new FormulaEvaluator({
    'x': 10,
    'y': 5
  });

  document.getElementById('calculate').addEventListener('click', () => {
    const formula = document.getElementById('formula').value;
    const result = evaluator.evaluate(formula);
    document.getElementById('result').textContent = result.error 
      ? `Error: ${result.error}` 
      : `Result: ${result.result}`;
  });
});