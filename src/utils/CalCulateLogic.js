/**
 * 计算逻辑
 * 使用方法：
 *  1.引入该模块 import CalCulateLogic from '@/utils/CalCulateLogic';
 *  2.new一个实例 const calCulateLogic = new CalCulateLogic()
 *  3.调用方法 evalute
 *     @param strs 第一个参数是数学运算表达式，字符串型的
 *     @param isRad 第二个参数表示三角函数的值是否为弧度，默认是true，表示值是弧度。 传入false表示值是角度
 *     calCulateLogic.evalute(strs,false)
 * */ 

const Decimal = require('decimal.js')
Decimal.set({ precision: 30 });
const maxSafeInteger = Number.MAX_SAFE_INTEGER;
const factorial = function (n, min = 0, max = maxSafeInteger) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    const error = new Error('超出范围');
    error.flag = '1'
    throw error;
  }
  // 阶乘的定义：0的阶乘为1，负数没有阶乘
  if (n === 0) {
    return 1;
  } else if (n < 0) {
    const error = new Error('阶乘只定义于非负整数');
    error.flag = '1'

    throw error;
  }

  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return new Decimal(result).toDecimalPlaces(10);
}

// 角度转弧度
function degreesToRadians(degrees) {
  const radians = degrees * (Math.PI / 180);
  return radians;
}




class CalCulateLogic {
  constructor() {
    this.mathSymbol = ['+', '-', 'x', '÷', '.', '(', ')', '%', 
                       '1/X', 'X 2', 'X 3', '^', 'X y', 'EXP', '1/x',
                       'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 
                       'log', 'ln', 'ex', '10x',
                       '√', '3√', 'n√', 'y √x',
                       'n!', 'π', 'e', 'mod', '+/-', 'X!',
                       '00']
  }

  //  运算符优先级表，用于判断运算符优先级, 值越高优先级越高
  getPrecendence(token) {
    if(['+',"-"].includes(token)){
      return 1;
    }
    if(['*','/','mod','%'].includes(token)){
      return 2;
    }
    if(['sin','cos','tan','asin','acos','atan','log','ln','√','3√'].includes(token)){
      return 3;
    }
    if(/\d+√/.test(token)){
      return 3;
    }
    if(['^','!'].includes(token)){
      return 4;
    }
    return 0;
  }
  getMathSymbol (){
    return this.mathSymbol
  }
  // 方法：词法分析获得tokens
  lexer(expression) {
      const tokensList =[]
      let current = 0;
      let isNegativeNumber = false;
      while (current < expression.length) {
        let char = expression[current];
    
        // 忽略空白字符
        if (/\s/.test(char)) {
          current++;
          continue;
        }

        // 匹配数字（包括负数、小数的情况）
        // 如果当前字符是数字
        if (/\d/.test(char)) {
          let value = char;
          current++;
          while (current < expression.length && (/\d|\./.test(expression[current]))) {
            value += expression[current];
            current++;
          }
          // 如果下一个字符是小数点，则继续识别小数部分
          if (expression[current] === '.') {
            value += expression[current];
            current++;

            while (current < expression.length && /\d/.test(expression[current])) {
              value += expression[current];
              current++;
            }
          }
          // 匹配 n√   3√  13√
          // 如果下一个字符是 √
          if(expression[current] === '√'){
            tokensList.push(value + expression[current]);
            current++;
            continue;
          }
          // 如果是负数
          if (isNegativeNumber){
            tokensList.push("-" + value);
          }else{
            tokensList.push(value);
          }
          continue;
        }

        
        // 匹配运算符
        // if (char in this.operators) {
        if(this.getPrecendence(char)!==0){
          // 处理负数情况
          /**
           * 当前字符是 - 
           * 1.如果是第一个字符，例如 -5的-是第一个字符，就是负号标记
           * 2.如果上一个字符是(,并且下个字符是数字 例如(-5), 就是负号标记
           * 3.如果上一个字符是运算符，例如 2+-5 是负号标记
           * 4.如果上一个字符是！，2!-5, 这不是负号标记
           * 4.如果上一个字符是！，2%-5, 这不是负号标记
           */
          // if (char === '-' && ((current === 0 || expression[current - 1] in this.operators || expression[current - 1] === '(') && /\d|\./.test(expression[current + 1]))) {
          if (char === '-' 
          && ((current === 0 || this.getPrecendence(expression[current - 1]) !==0 || expression[current - 1] === '(') 
          && /\d|\./.test(expression[current + 1]))
          && expression[current - 1] !== '!'
          && expression[current - 1] !== '%') {
            isNegativeNumber = true;
            current++;
            continue;
          }else{
            isNegativeNumber = false;
          }
          tokensList.push(char);
          current++;
          continue;
        }
        if(char === '('){
          tokensList.push(char);
          current++;
          continue;
        }
        if(char === ')'){
          tokensList.push(char);
          current++;
          continue;
        }
    
        // 如果是字母，收集连续的字符，判断是否为标识符(函数)
        if (/[a-zA-Z]/.test(char)) {
          let value = '';
          while (current < expression.length && /[a-zA-Z]/.test(char)) {
            value += char;
            current++;
            char = expression[current];
          }
          tokensList.push(value)
          continue;
        }
        // 如果是其他未知字符，抛出错误
        const error = new Error('表达式异常');
        error.flag = '1'
        throw error;
      }
      return tokensList;
  }

  // 方法：将中缀表达式转换为后缀表达式
  infixToPostfix(infixExpressionTokens) {
    // const infixExpressionTokens = infixExpression.split(/\s+/); // 将中缀表达式字符串按照空格进行分隔，生成一个新的数组 
    const postfix = [];  // 后缀表达式数组，用于存储转换后的结果
    const operatorStack = []; // 运算符栈，用于转换中缀表达式为后缀表达式
    // 遍历中缀表达式的每个token
    for (let token of infixExpressionTokens) {
      if(this.checkNumberType(token)){
        postfix.push(token); // 数字直接输出到后缀表达式
      } else if (token === '(') {   // 左括号直接入栈
        operatorStack.push(token);
      } else if (token === ')') {
        // 当遇到')'，弹出操作符栈中的运算符直到遇到'('，将这对括号内的运算符加入后缀表达式
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
          postfix.push(operatorStack.pop());
        }
        if (operatorStack.length === 0 || operatorStack[operatorStack.length - 1] !== '(') {
          const error = new Error('括号不匹配');
          error.flag = '1'
          throw error;
        }
        operatorStack.pop(); // 弹出 '('
      } else if(this.getPrecendence(token)!==0) {
      // 当遇到运算符，将操作符栈中优先级高于或等于当前运算符的运算符弹出，加入后缀表达式
        while (
          operatorStack.length > 0 &&
          this.getPrecendence(operatorStack[operatorStack.length - 1]) >= this.getPrecendence(token)
        ) {
          postfix.push(operatorStack.pop());
        }
        operatorStack.push(token);  // 当前运算符入栈
      } else {
        const error = new Error('表达式异常');
        error.flag = '1'
        throw error;
      }
    }
    // 将剩余的运算符加入后缀表达式
    while (operatorStack.length > 0) {
      const operator = operatorStack.pop();
      if (operator === '(') {
        const error = new Error('括号不匹配');
        error.flag = '1'
        throw error;
      }
      postfix.push(operator);
    }

    // 如果运算符栈不为空，说明表达式缺少运算符或操作数。
    if(operatorStack.length){
      // throw new Error('表达式出错');
      const error = new Error('表达式异常');
      error.flag = '1'
      throw error;
    }
    return postfix;
  }

  // 方法：计算后缀表达式, 
  // rad 默认参数为true。表示默认为弧度
  evaluatePostfix(postfixTokens,rad=true) {
      const operandStack = [];   // 操作数栈，用于后缀表达式求值
      let operand2,operand1 = null;
      // 遍历后缀表达式的每个token
      for (let token of postfixTokens) {
        if (this.checkNumberType(token)) {
          operandStack.push(new Decimal(token)); // 如果是数字，将其加入操作数栈
        } else {
          // 特殊处理 n√ 的情况
          if(/\d+√/.test(token)){
            const basis = token.slice(0,-1)
            const powBas = new Decimal(1/basis)
            operand2 = operandStack.pop()
            if(typeof operand2!=='undefined' && operand2.toNumber() >= 0 && operand2.isFinite()){
              operandStack.push(Decimal.pow(operand2,powBas));
            }else{
              throw new Error('√只适用于非负实数');
            }
            continue;
          }
          // 如果是运算符，弹出两个操作数进行计算，然后将结果加入操作数栈
          switch (token) {
            // 判断单目运算/函数运算符
            case 'sin':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.sin(operand2));
  
                }else{
                  operandStack.push(Decimal.sin(operand2.times(Decimal.acos(-1)).div(180)));
                }
              }
              break;
            case 'cos':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.cos(operand2));
                }else{
                  operandStack.push(Decimal.cos(operand2.times(Decimal.acos(-1)).div(180)));
                }
              }
              break;
            case 'tan':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.tan(operand2));
                  
                }else{
                  operandStack.push(Decimal.tan(operand2.times(Decimal.acos(-1)).div(180)));
                }
              }
              break;
            // asin、acos、atan的输入单位是数值，输出单位是弧度/角度，asin、acos输入范围是[-1,1]
            case 'asin':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined' && (operand2.toNumber()>1||operand2.toNumber()<-1)){
                const error = new Error('asin输入值范围是[-1,1]');
                error.flag = '1'
                throw error;
              }
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.asin(operand2));
  
                }else{
                  operandStack.push(Decimal.asin(operand2).times(180).dividedBy(Math.PI));
                }
              }
              
              break;
            case 'acos':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined' && (operand2.toNumber()>1||operand2.toNumber()<-1)){
                const error = new Error('acos输入值范围是[-1,1]');
                error.flag = '1'
                throw error;
              }
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.acos(operand2));
                }else{
                  operandStack.push(Decimal.acos(operand2).times(180).dividedBy(Math.PI));
                } 
              }
              break;
            case 'atan':
              operand2 = operandStack.pop();
              // 如果是弧度
              if(typeof operand2!=='undefined'){
                if(rad){
                  operandStack.push(Decimal.atan(operand2));
                }else{
                  operandStack.push(Decimal.atan(operand2).times(180).dividedBy(Math.PI));
                }
              }
              break;
            case 'log':
              operand2 = operandStack.pop()
              if(typeof operand2!=='undefined' && operand2.toNumber() > 0 && operand2.isFinite()){
                operandStack.push(Decimal.log(operand2));
              }else{
                const error = new Error('lg只适用于非负实数');
                error.flag = '1'
                throw error;
              }
              
              break;
            case 'ln':
              operand2 = operandStack.pop()
              if(typeof operand2!=='undefined' && operand2.toNumber() > 0 && operand2.isFinite()){
                operandStack.push(Decimal.ln(operand2));
              }else{
                const error = new Error('ln只适用于非负实数');
                error.flag = '1'
                throw error;
              }
              break;
            case '√':
              operand2 = operandStack.pop()
              if(typeof operand2!=='undefined' && operand2.toNumber() >= 0 && operand2.isFinite()){
                operandStack.push(Decimal.sqrt(operand2));
              }else{
                const error = new Error('√只适用于非负实数');
                error.flag = '1'
                throw error;
              }
              break;
            case '!':
              operand2 = operandStack.pop()
              if(typeof operand2!=='undefined' && operand2.toNumber() >= 0 && Number.isInteger(operand2.toNumber())){
                operandStack.push(factorial(operand2.toNumber()));
              }else{
                const error = new Error('阶乘只适用于非负整数');
                error.flag = '1'
                throw error;
              }
              break;
            case '%':
              operand2 = operandStack.pop();
              if(typeof operand2!=='undefined' && operand2 !== undefined){
                if(Decimal.isDecimal(operand2)){
                  operandStack.push(operand2.div('100'));
                }else{
                  operandStack.push(operand2*0.01);
                }
              }
              break;
            // 判断双目运算
            case '+':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                if(Decimal.isDecimal(operand1) || Decimal.isDecimal(operand2)){
                  operandStack.push(Decimal.add(operand1,operand2));
                }else{
                  operandStack.push(operand1 + operand2);
                }
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            case '-':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                if(Decimal.isDecimal(operand1) || Decimal.isDecimal(operand2)){
                  operandStack.push(Decimal.sub(operand1,operand2));
                }else{
                  operandStack.push(operand1 - operand2);
                }
                
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            case '*':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                if(Decimal.isDecimal(operand1) || Decimal.isDecimal(operand2)){
                  operandStack.push(Decimal.mul(operand1,operand2));
                }else{
                  operandStack.push(operand1 * operand2);
                }
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            case '/':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && operand2.toNumber()===0){
                const error = new Error('除数不能为0');
                error.flag = '1'
                throw error;
              }else if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                if(Decimal.isDecimal(operand1) || Decimal.isDecimal(operand2)){
                  operandStack.push(Decimal.div(operand1,operand2));
                }else{
                  operandStack.push(operand1 / operand2);
                }
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            case '^':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                operandStack.push(Decimal.pow(operand1, operand2));
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            case 'mod':
              operand2 = operandStack.pop();
              operand1 = operandStack.pop();
              if (typeof operand2!=='undefined' && typeof operand1!=='undefined'){
                operandStack.push(Decimal.mod(operand1,operand2));
              } else {
                const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
              }
              break;
            default:
              const error = new Error('表达式异常');
                error.flag = '1'
                throw error;
          }
        }
      }
      if(typeof operandStack[0] !== 'undefined'){
        return operandStack[0];
      }else{
        const error = new Error('表达式异常');
        error.flag = '1'
        throw error;
      }
      
  }

  // 方法：计算中缀表达式
  evalute(expression,rad=true){
    // 对数学表达式expression进行预处理
    // 使用正则表达式替换 'x' 为 '*'
    expression = expression.replace(/×/g, '*');
    // 使用正则表达式替换 '÷' 为 '/'
    expression = expression.replace(/÷/g, '/');
    // 使用正则表达式替换 ',' 为 ''
    expression = expression.replace(/,/g, '');
    // 只要有tan(π/2) 弧度制，式子结果是无穷大，提示超出范围
    if(rad&&/tan\(\s*π\s*\/\s*2\s*\)/.test(expression)){
      const error = new Error('超出范围');
      error.flag = '1'
      throw error;
    }
    // 处理π和e
    
     // 使用正则表达式替换匹配的内容
    expression = expression.replace(/(\d+)(π|e)/g, '$1*$2');
    // 再把π和e替换成数字
    // 使用正则表达式替换匹配的内容
    const pattern = /π|e/g;
    expression = expression.replace(pattern, match => {
      if (match === "π") {
          // return this.formatNumberWithMaxDecimal(Math.PI).toString();
          return Math.PI;
      } else if (match === "e") {
          // return this.formatNumberWithMaxDecimal(Math.E).toString();
          return Math.E;
      }
    });
    try{
      const infix = this.lexer(expression);
      const postfix = this.infixToPostfix(infix);
      const result = this.evaluatePostfix(postfix,rad);
      if(isNaN(result)){
        const error = new Error('表达式异常');
        error.flag = '1'
        throw error;
      }else if(typeof operand2!=='undefined' || result.toNumber()=== Infinity){
        const error = new Error('值超出范围');
        error.flag = '1'
        throw error;
      }else{
        return this.formatNumberWithMaxDecimal(result,10)
      }
    }catch(error){
      throw error;
    }
  }
  
  // 方法：判断表达式是否错误
  expressionIsValid(expression,rad=true){
    if(expression.includes('=')){
      const arr = expression.split('=');
      if(arr[0]===arr[1]){
        return
      }else{
        const error = new Error('表达式错误');
        error.flag = '1'
        throw error;
      }
    }
    // 对数学表达式expression进行预处理
    // 使用正则表达式替换 'x' 为 '*'
    expression = expression.replace(/×/g, '*');
    // 使用正则表达式替换 '÷' 为 '/'
    expression = expression.replace(/÷/g, '/');
    // 使用正则表达式替换 ',' 为 ''
    expression = expression.replace(/,/g, '');
    // 只要有tan(π/2) 弧度制，式子结果是无穷大，提示超出范围
    if(rad&&/tan\(\s*π\s*\/\s*2\s*\)/.test(expression)){
      const error = new Error('超出范围');
      error.flag = '1'
      throw error;
    }
    // 处理π和e
    
     // 使用正则表达式替换匹配的内容
    expression = expression.replace(/(\d+)(π|e)/g, '$1*$2');
    // 再把π和e替换成数字
    // 使用正则表达式替换匹配的内容
    const pattern = /π|e/g;
    expression = expression.replace(pattern, match => {
      if (match === "π") {
          // return this.formatNumberWithMaxDecimal(Math.PI).toString();
          return Math.PI;
      } else if (match === "e") {
          // return this.formatNumberWithMaxDecimal(Math.E).toString();
          return Math.E;
      }
    });
    try{
      // 如果转成后缀表达式没问题，表达式就没问题
      const infix = this.lexer(expression);
      this.infixToPostfix(infix);
    }catch(error){
      throw error;
    }
  }

  // 每个操作符返回的真实操作
  translateOperator(operator) {
    switch (operator) {
      case '+':
        return '+';
      case '-':
        return '-';
      case 'x':
        return '×';
      case '÷':
        return  '÷';
      case '.':
        return '.';
      case '(':
        return '(';
      case ')':
        return ')';
      case '%':
        return '%';
      case '1/x':
        return '^(-1)';
      case 'X 2':
        return '^2';
      case 'X 3':
        return '^3';
      case '^':
        return '^(';
      case 'X y':
        return '^(';
      case 'EXP':
        return 'e^('
      case 'sin':
        return 'sin(';
      case 'cos':
        return 'cos(';
      case 'tan':
        return 'tan(';
      case 'asin':
        return 'asin(';
      case 'acos':
        return 'acos(';
      case 'atan':
        return 'atan(';
      case 'log':
        return 'log(';
      case 'ln':
        return 'ln(';
      case 'ex':
        return 'e^(';
      case '10x':
        return '10^(';
      case '√':
        return '√';
      case '3√':
        return '3√';
      case 'n√':
        return '√';
      case 'y √x':
        return '√';
      case 'n!':
        return '!';
      case 'X!':
        return '!';
      case 'π':
        return 'π';
      case 'e':
        return 'e';
      case 'mod':
        return 'mod';
      case '+/-':
        return '×(-1)';
      case '00':
        return '00';
    }
  }
  // 格式化数字(保留小数位)
  formatNumberWithMaxDecimal(number, maxDecimal) {

    if(typeof number === 'undefined'){
      return '';
    }
    const originalString = number.toString();
    const decimalIndex = originalString.indexOf('.');
    if (decimalIndex !== -1 && !originalString.includes('e')) {
      const decimalPlaces = originalString.length - decimalIndex - 1;
      if (decimalPlaces > maxDecimal) {
        // 如果小数位数超过 maxDecimal，保留 maxDecimal 位小数
        return number.toFixed(maxDecimal).toString().replaceAll('e','E');
      }
    }
    // 否则直接返回原始数字的字符串形式
    return number.toString().replaceAll('e','E');
  }
  // 判断字符串是不是合格的数字格式
  checkNumberType(inputString) {
    // 匹配整数、负整数、小数
    const integerPattern = /^-?\d+$/;
    const decimalPattern = /^-?\d+\.\d+$/;

    if (integerPattern.test(inputString)) {
        return true;
    } else if (decimalPattern.test(inputString)) {
        return true;
    } else {
        return false;
    }
  }
}

export default CalCulateLogic;
