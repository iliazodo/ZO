// DOM references
const runBtn = document.getElementById("run");
const stopBtn = document.getElementById("stop");
const display = document.getElementById("display");
const codeText = document.getElementById("textEditor");

// ZO variables
let outputs = "";
let storage = {};

// Program setting
window.onload = function () {
  runBtn.addEventListener("click", readCode);
  stopBtn.addEventListener("click", removeOutput);
};

function readCode() {
  outputs = "";
  storage = {}; // Reset storage on each run
  let code = codeText.value;
  let statements = smartSplit(code);
  statements.forEach((s) => interpret(s));
}

function interpret(statement) {
  if (statement.trim() == "") {
    return;
  }

  // Separating tokens(args)
  const tokens = statement.match(/"[^"]*"|\S+/g);
  if (!tokens || tokens.length === 0) return;
  
  const cmd = tokens[0];
  const args = tokens.slice(1);

  // Processing
  if (cmd === "say") {
    // Output
    if (isArithmeticEX(args)) {
      try {
        const value = eval(openVariables(args).join(" "));
        outputs += value;
      } catch (error) {
        outputs += "Error: " + error.message;
      }
    } else if (args[0] && args[0][0] === '"' && args[0][args[0].length - 1] === '"') {
      outputs += args[0].slice(1, args[0].length - 1).replace(/\\n/g, "\n");
    } else if (args[0] && args[0] in storage) {
      outputs += storage[args[0]];
    } else if (args[0] && !isNaN(Number(args[0]))) {
      outputs += args[0];
    } else {
      outputs += "ReferenceError: Unknown " + args.join(" ");
    }
  } else if (cmd === "new") {
    // Creating new variable
    if (args[1] === "=") {
      if (isArithmeticEX(args.slice(2))) {
        try {
          const value = eval(openVariables(args.slice(2)).join(" "));
          storage[args[0]] = value;
        } catch (error) {
          outputs += "Error: " + error.message;
        }
      } else if (args[2] && args[2][0] === '"' && args[2][args[2].length - 1] === '"') {
        storage[args[0]] = args[2]
          .slice(1, args[2].length - 1)
          .replace(/\\n/g, "\n");
      } else if (
        args[2] === "ask" &&
        args[3] && args[3][0] === '"' &&
        args[3][args[3].length - 1] === '"'
      ) {
        storage[args[0]] = window.prompt(args[3].slice(1, args[3].length - 1));
      } else if (args[2]) {
        storage[args[0]] = Number(args[2]);
      }
    } else {
      outputs += "SyntaxError: Unknown " + args.join(" ");
    }
  } else if (cmd === "ask") {
    // Getting input
    if (args[0] && args[0][0] === '"' && args[0][args[0].length - 1] === '"') {
      window.prompt(args[0].slice(1, args[0].length - 1));
    } else {
      outputs += "TypeError: " + args.join(" ") + " must be string";
    }
  } else if (args[0] === "=") {
    // Changing variable value
    if (cmd in storage) {
      if (isArithmeticEX(args.slice(1))) {
        try {
          const value = eval(openVariables(args.slice(1)).join(" "));
          storage[cmd] = value;
        } catch (error) {
          outputs += "Error: " + error.message;
        }
      } else if (args[1] && args[1][0] === '"' && args[1][args[1].length - 1] === '"') {
        storage[cmd] = args[1].slice(1, args[1].length - 1).replace(/\\n/g, "\n");
      } else if (
        args[1] === "ask" &&
        args[2] && args[2][0] === '"' &&
        args[2][args[2].length - 1] === '"'
      ) {
        storage[cmd] = window.prompt(args[2].slice(1, args[2].length - 1));
      } else if (args[1]) {
        storage[cmd] = Number(args[1]);
      }
    } else {
      outputs += "ReferenceError: Unknown " + cmd;
    }
  } else if (cmd == "if") {
    try {
      let v1 = getValue(args[0]);
      let v2 = getValue(args[2]);

      if (args[1] == "==") {
        if (v1 == v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else if (args[1] == "!=") {
        if (v1 != v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else if (args[1] == ">") {
        if (v1 > v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else if (args[1] == ">=") {
        if (v1 >= v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else if (args[1] == "<") {
        if (v1 < v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else if (args[1] == "<=") {
        if (v1 <= v2) {
          handleMultipleCmd(args.slice(3).join(" "));
        }
      } else {
        outputs += "syntax error: " + cmd + " " + args.join(" ");
      }
    } catch (error) {
      outputs += "Error in if statement: " + error.message;
    }
  } else if (cmd == "loop") {
    try {
      // Safety counter to prevent infinite loops
      let loopCount = 0;
      const MAX_LOOPS = 10000;
      
      while (loopCount < MAX_LOOPS) {
        loopCount++;
        
        // Get current values of comparison variables
        let v1 = getValue(args[0]);
        let v2 = getValue(args[2]);
        
        let shouldContinue = false;
        
        if (args[1] == "==") {
          shouldContinue = (v1 == v2);
        } else if (args[1] == "!=") {
          shouldContinue = (v1 != v2);
        } else if (args[1] == ">") {
          shouldContinue = (v1 > v2);
        } else if (args[1] == ">=") {
          shouldContinue = (v1 >= v2);
        } else if (args[1] == "<") {
          shouldContinue = (v1 < v2);
        } else if (args[1] == "<=") {
          shouldContinue = (v1 <= v2);
        } else {
          outputs += "syntax error in loop: " + args.join(" ");
          break;
        }
        
        if (!shouldContinue) {
          break;
        }
        
        // Execute the loop body
        handleMultipleCmd(args.slice(3).join(" "));
        
        // Check if we're approaching an infinite loop
        if (loopCount === MAX_LOOPS) {
          outputs += "\nWarning: Loop execution limit reached. Possible infinite loop detected.";
        }
      }
    } catch (error) {
      outputs += "Error in loop: " + error.message;
    }
  } else {
    outputs += "Unknown command: " + cmd;
  }

  displayOutput();
}

// Get value from variable or literal
function getValue(arg) {
  if (!arg) return undefined;
  
  if (arg in storage) {
    return storage[arg];
  } else if (arg[0] === '"' && arg[arg.length - 1] === '"') {
    return arg.slice(1, arg.length - 1);
  } else if (!isNaN(Number(arg))) {
    return Number(arg);
  }
  return arg; // Return as is if no match
}

// Detect arithmetic
function isArithmeticEX(text) {
  if (!text || text.length === 0) return false;
  
  return text.some(item => 
    item.includes("+") ||
    item.includes("-") ||
    item.includes("/") ||
    item.includes("*") ||
    item.includes("%")
  );
}

function openVariables(args) {
  return args.map(arg => storage[arg] !== undefined ? storage[arg] : arg);
}

function handleMultipleCmd(block) {
  if (!block) return;
  
  if (block[0] === "{" && block[block.length - 1] === "}") {
    block = block.slice(1, block.length - 1).trim(); // Remove surrounding curly braces
    
    // Split by semicolons but respect nested blocks
    const statements = smartSplit(block);
    
    statements.forEach(stmt => {
      if (stmt.trim()) {
        interpret(stmt.trim()); // Process each statement inside the block
      }
    });
  } else {
    interpret(block); // Handle a single command if it's not a block
  }
}

function smartSplit(code) {
  if (!code) return [];
  
  let parts = [];
  let current = "";
  let depth = 0;
  let inString = false;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    
    // Handle string literals
    if (char === '"' && (i === 0 || code[i-1] !== '\\')) {
      inString = !inString;
    }
    
    // Only count braces outside of strings
    if (!inString) {
      if (char === "{") depth++;
      if (char === "}") depth--;
    }
    
    // Split by semicolons when not in a string and not inside braces
    if (char === ";" && depth === 0 && !inString) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  if (current.trim()) parts.push(current.trim());
  
  return parts;
}

// Output setting
function displayOutput() {
  display.value = outputs;
  display.style.display = "block";
}

function removeOutput() {
  outputs = "";
  display.value = "";
  display.style.display = "none";
}