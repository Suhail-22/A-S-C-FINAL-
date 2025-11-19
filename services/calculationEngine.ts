export function preprocessExpression(expr: string): string {
    if (!expr) return expr;
    // Handles X% -> (X/100). The logic for %X has been removed as it was considered an error by the user.
    let pExpr = expr.replace(/(\d+(?:\.\d*)?|\.\d+)%/g, '($1/100)');
    return pExpr;
}

export function parseExpression(expr: string): number {
    if (!expr) return 0;
    // Replaced lookbehind `(?<=^|[-+*/(])` with `(^|[-+*/(])` and a backreference `$1` for broader browser compatibility.
    expr = expr.replace(/(^|[-+*/(])-/g, '$1N');
    const tokens: (number | string)[] = [];
    let i = 0;
    while (i < expr.length) {
        const char = expr[i];
        if (/\d/.test(char) || (char === '.')) {
            let numStr = '';
            while (i < expr.length && /[\d.]/.test(expr[i])) {
                numStr += expr[i];
                i++;
            }
            if ((numStr.match(/\./g) || []).length > 1) throw new Error('نقطة عشرية غير صالحة');
            tokens.push(parseFloat(numStr));
        } else if (char === 'N') {
            tokens.push('N');
            i++;
        } else if (['(', ')', '+', '-', '*', '/'].includes(char)) {
            if (char === '(' && i + 1 < expr.length && expr[i+1] === ')') {
              throw new Error('تعبير غير صالح');
            }
            tokens.push(char);
            i++;
        } else {
            throw new Error('رمز غير معروف');
        }
    }
    if (tokens.length === 0) return 0;
    const output: (number | string)[] = [];
    const operators: string[] = [];
    const precedence: { [key: string]: number } = { '+': 1, '-': 1, '*': 2, '/': 2, 'N': 3 };
    const isOperator = (t: string) => ['+', '-', '*', '/', 'N'].includes(t);
    for (const token of tokens) {
        if (typeof token === 'number') {
            output.push(token);
        } else if (token === '(') {
            operators.push(token);
        } else if (token === ')') {
            while (operators.length > 0 && operators[operators.length - 1] !== '(') {
                output.push(operators.pop()!);
            }
            if (operators.length === 0) throw new Error('أقواس غير متوازنة');
            operators.pop();
        } else if (isOperator(token as string)) {
            while (operators.length > 0 && operators[operators.length - 1] !== '(' && precedence[operators[operators.length - 1]] >= precedence[token]) {
                output.push(operators.pop()!);
            }
            operators.push(token as string);
        }
    }
    while (operators.length > 0) {
        const op = operators.pop()!;
        if (op === '(') throw new Error('أقواس غير متوازنة');
        output.push(op);
    }
    const stack: number[] = [];
    for (const token of output) {
        if (typeof token === 'number') {
            stack.push(token);
        } else if (isOperator(token as string)) {
            if (token === 'N') {
                if (stack.length < 1) throw new Error('تعبير غير صالح');
                stack.push(-stack.pop()!);
                continue;
            }
            if (stack.length < 2) throw new Error('تعبير غير صالح');
            const b = stack.pop()!;
            const a = stack.pop()!;
            let result: number;
            switch (token) {
                case '+': result = a + b; break;
                case '-': result = a - b; break;
                case '*': result = a * b; break;
                case '/':
                    if (b === 0) throw new Error('القسمة على صفر');
                    result = a / b;
                    break;
                default: throw new Error('عامل غير معروف');
            }
            stack.push(result);
        }
    }
    if (stack.length !== 1) throw new Error('تعبير غير صالح');
    return stack[0];
}