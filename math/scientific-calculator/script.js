document.addEventListener('DOMContentLoaded', function () {
    const inputDisplay = document.getElementById('input-display'); // Top screen
    const resultDisplay = document.getElementById('result-display'); // Bottom screen
    const keys = document.querySelector('.keys');
    const decimalPlacesSelect = document.getElementById('decimal-places');
    const variablesList = document.getElementById('variables-list');
    const clearVariablesButton = document.getElementById('clear-variables');
    let lastAnswer = 0;
    let degreesMode = true;
    let variables = {}; // Object to store variables

    // Get references to the 'Deg' and 'Rad' buttons
    const degButton = document.querySelector('button[data-function="Deg"]');
    const radButton = document.querySelector('button[data-function="Rad"]');

    // Initialize mode display
    updateModeDisplay();

    // Event listener for button clicks
    keys.addEventListener('click', function (e) {
        const target = e.target;
        if (target.matches('button')) {
            if (target.classList.contains('number')) {
                inputNumber(target.getAttribute('data-number'));
            } else if (target.classList.contains('operator')) {
                inputOperator(target.getAttribute('data-operator'));
            } else if (target.classList.contains('function')) {
                handleFunction(target.getAttribute('data-function'));
            }
        }
    });

    // Event listener for the ENTER key
    inputDisplay.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission or line break
            calculateResult();
        }
    });

    // Event listener for the Clear Variables button
    clearVariablesButton.addEventListener('click', function () {
        variables = {};
        updateVariablesList();
        resultDisplay.value = '';
    });

    function inputNumber(num) {
        inputDisplay.value += num;
    }

    function inputOperator(op) {
        if (op === '√') {
            inputDisplay.value += 'sqrt(';
        } else {
            inputDisplay.value += op;
        }
    }

    function handleFunction(func) {
        switch (func) {
            case 'sin':
            case 'cos':
            case 'tan':
            case 'log':
            case 'ln':
            case 'exp':
            case 'abs':
                inputDisplay.value += func + '(';
                break;
            case 'pi':
                inputDisplay.value += 'pi';
                break;
            case 'e':
                inputDisplay.value += 'e';
                break;
            case '±':
                toggleSign();
                break;
            case '=':
                calculateResult();
                break;
            case 'C':
                clearAll();
                break;
            case 'CE':
                clearEntry();
                break;
            case 'Deg':
                degreesMode = true;
                updateModeDisplay();
                break;
            case 'Rad':
                degreesMode = false;
                updateModeDisplay();
                break;
            case 'ans':
            case 'Ans':
                inputDisplay.value += lastAnswer;
                break;
        }
    }

    function updateModeDisplay() {
        if (degreesMode) {
            degButton.classList.add('active-mode');
            radButton.classList.remove('active-mode');
        } else {
            radButton.classList.add('active-mode');
            degButton.classList.remove('active-mode');
        }
    }

    function toggleSign() {
        if (inputDisplay.value.startsWith('-')) {
            inputDisplay.value = inputDisplay.value.substring(1);
        } else {
            inputDisplay.value = '-' + inputDisplay.value;
        }
    }

    function clearAll() {
        inputDisplay.value = '';
        resultDisplay.value = '';
    }

    function clearEntry() {
        inputDisplay.value = inputDisplay.value.slice(0, -1);
    }

    function updateVariablesList() {
        variablesList.innerHTML = '';
        for (let [key, value] of Object.entries(variables)) {
            const p = document.createElement('p');
            p.textContent = `${key} = ${value}`;
            variablesList.appendChild(p);
        }
    }

    function calculateResult() {
        try {
            let expr = inputDisplay.value.trim();

            // Check for variable assignment (e.g., a = 1)
            if (expr.includes('=')) {
                let [varName, varValue] = expr.split('=').map(s => s.trim());

                // Validate variable name
                if (!/^[a-zA-Z]\w*$/.test(varName)) {
                    throw new Error('Invalid variable name');
                }

                // Forbidden names
                const forbiddenNames = ['pi', 'e', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'abs', 'sqrt', 'ans', 'Math'];
                if (forbiddenNames.includes(varName) || varName in Math) {
                    throw new Error(`Variable name '${varName}' is not allowed`);
                }

                // Evaluate the variable value
                let valueExpr = varValue;

                // Replace variables in the value expression
                valueExpr = replaceVariables(valueExpr);

                let value = evaluateExpression(valueExpr);

                // Store the variable
                variables[varName] = value;
                updateVariablesList();
                resultDisplay.value = `${varName} = ${value}`;
            } else {
                // Replace variables in the expression
                expr = replaceVariables(expr);

                let result = evaluateExpression(expr);

                resultDisplay.value = result.toString();
                lastAnswer = result;
            }
        } catch (error) {
            resultDisplay.value = error.message;
        }
    }

    function replaceVariables(expr) {
        // Replace constants pi and e with Math.PI and Math.E
        expr = expr.replace(/pi/g, 'Math.PI');
        expr = expr.replace(/\be\b/g, 'Math.E'); // \b ensures only standalone 'e' is replaced

        // Replace variables
        for (let [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            expr = expr.replace(regex, `(${value})`);
        }

        return expr;
    }

    function evaluateExpression(expr) {
        // Replace mathematical function names with JavaScript Math methods
        expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
        expr = expr.replace(/sin\(/g, 'Math.sin(');
        expr = expr.replace(/cos\(/g, 'Math.cos(');
        expr = expr.replace(/tan\(/g, 'Math.tan(');
        expr = expr.replace(/log\(/g, 'Math.log10(');
        expr = expr.replace(/ln\(/g, 'Math.log(');
        expr = expr.replace(/exp\(/g, 'Math.exp(');
        expr = expr.replace(/abs\(/g, 'Math.abs(');
        expr = expr.replace(/\^/g, '**');

        // If in degrees mode, convert degrees to radians for trig functions
        if (degreesMode) {
            expr = expr.replace(/Math\.sin\(([^)]+)\)/g, function (match, p1) {
                return 'Math.sin((' + p1 + ') * (Math.PI/180))';
            });
            expr = expr.replace(/Math\.cos\(([^)]+)\)/g, function (match, p1) {
                return 'Math.cos((' + p1 + ') * (Math.PI/180))';
            });
            expr = expr.replace(/Math\.tan\(([^)]+)\)/g, function (match, p1) {
                return 'Math.tan((' + p1 + ') * (Math.PI/180))';
            });
        }

        let result = mathEval(expr);

        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid Calculation');
        }

        // Apply decimal places setting
        let decimalPlaces = parseInt(decimalPlacesSelect.value);
        result = parseFloat(result.toFixed(decimalPlaces));

        return result;
    }

    function mathEval(expr) {
        // Use Function constructor instead of eval for safer evaluation
        try {
            const func = new Function('return ' + expr);
            return func();
        } catch (error) {
            throw new Error('Invalid Calculation');
        }
    }
});
