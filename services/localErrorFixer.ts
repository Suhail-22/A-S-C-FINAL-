
export function getLocalFix(expression: string): { fix: string; message: string; } {
    let fixedExpr = expression;
    
    // Rule 1: Fix duplicate operators (e.g., 5++3 -> 5+3)
    const originalExprAfterRule1 = fixedExpr;
    fixedExpr = fixedExpr.replace(/([+\-×÷])\1+/g, '$1');
    if (fixedExpr !== originalExprAfterRule1) {
        return { fix: fixedExpr, message: 'تمت إزالة عامل التشغيل المكرر.' };
    }
    
    // Rule 2: Handle empty parentheses (e.g., 6*() -> 6)
    if (fixedExpr.includes('()')) {
        const originalExprAfterRule2 = fixedExpr;
        fixedExpr = fixedExpr.replace(/([+\-×÷]?)\(\)/g, '');
        if (fixedExpr !== originalExprAfterRule2) {
             return { fix: fixedExpr || '0', message: 'تمت إزالة الأقواس الفارغة.' };
        }
    }

    // Rule 3: Fix misplaced percentage sign (e.g., ÷%2 -> ÷2, %5 -> 5)
    // Fixed regex to avoid lookbehind for better browser compatibility
    const originalExprAfterNewRule = fixedExpr;
    fixedExpr = fixedExpr.replace(/(^|[^.\d])%(\d)/g, '$1$2');
    if (fixedExpr !== originalExprAfterNewRule) {
      return { fix: fixedExpr, message: 'تم إصلاح موضع علامة النسبة المئوية.' };
    }

    // Rule 4: Fix trailing operator (e.g., 5+ -> 5, or 5%-% -> 5%)
    const trailingOpRegex = /[+\-×÷%]+$/;
    if (trailingOpRegex.test(fixedExpr.trim())) {
        const cleanedExpr = fixedExpr.trim().replace(trailingOpRegex, '');
        if (cleanedExpr !== fixedExpr.trim()) {
            return { fix: cleanedExpr || '0', message: 'تمت إزالة عامل التشغيل في النهاية.' };
        }
    }
    
    // Rule 5: Mismatched parentheses (e.g., (9-2 -> (9-2))
    const openParenCount = (fixedExpr.match(/\(/g) || []).length;
    const closeParenCount = (fixedExpr.match(/\)/g) || []).length;
    if (openParenCount > closeParenCount) {
        fixedExpr += ')'.repeat(openParenCount - closeParenCount);
        return { fix: fixedExpr, message: 'تمت إضافة قوس إغلاق مفقود.' };
    }

    // Generic fallback
    return { message: 'التعبير يحتوي على خطأ.', fix: '' };
}

export function findErrorDetails(expression: string, message: string): { pre: string; highlight: string; post: string; } | null {
    if (message.includes('تنسيق النسبة المئوية غير صالح')) {
        // Safe regex replacement for /(?<![\d.])%/
        // Matches start of string followed by %, OR non-digit/non-dot followed by %
        const match = expression.match(/(^|[^.\d])%/); 
        if (match && typeof match.index === 'number') {
            const matchStr = match[0];
            // Calculate exact index of % within the match
            const percentIndexInMatch = matchStr.indexOf('%');
            const absoluteIndex = match.index + percentIndexInMatch;
            
            return {
                pre: expression.substring(0, absoluteIndex),
                highlight: '%',
                post: expression.substring(absoluteIndex + 1)
            };
        }
    }
    if (message.includes('أقواس غير متوازنة')) {
        let balance = 0;
        for (let i = 0; i < expression.length; i++) {
            if (expression[i] === '(') balance++;
            if (expression[i] === ')') balance--;
        }
        if (balance > 0) { // Unclosed open parenthesis
            let openParenIndex = expression.lastIndexOf('(');
             let tempBalance = 0;
             for (let i = openParenIndex; i < expression.length; i++) {
                 if (expression[i] === '(') tempBalance++;
                 if (expression[i] === ')') tempBalance--;
             }
             if (tempBalance > 0) {
                  return {
                    pre: expression.substring(0, openParenIndex),
                    highlight: expression[openParenIndex],
                    post: expression.substring(openParenIndex + 1)
                  };
             }
        }
    }
    if (message.includes('القسمة على صفر')) {
        const match = expression.match(/÷0(?!\.)/); // find ÷0 but not ÷0.5
        if (match && typeof match.index === 'number') {
            return {
                pre: expression.substring(0, match.index),
                highlight: '÷0',
                post: expression.substring(match.index + 2)
            };
        }
    }
    if (message.includes('تعبير غير صالح')) {
        const match = expression.match(/\(\)/);
        if (match && typeof match.index === 'number') {
            return {
                pre: expression.substring(0, match.index),
                highlight: '()',
                post: expression.substring(match.index + 2)
            };
        }
    }
    return null;
}
