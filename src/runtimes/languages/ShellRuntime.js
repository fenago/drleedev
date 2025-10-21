import BaseRuntime from '../BaseRuntime.js';

/**
 * ShellRuntime - Simulated Bash/Shell environment
 *
 * This is an EDUCATIONAL tool that simulates shell commands without actually executing them.
 * It parses common commands and returns simulated output showing what WOULD happen.
 *
 * SECURITY: Does NOT execute actual shell commands (major security risk).
 * Instead, it provides a safe learning environment for shell syntax.
 */
export default class ShellRuntime extends BaseRuntime {
  constructor(config = {}) {
    super('shell', {
      version: 'Simulated Bash 5.x',
      ...config,
    });

    // Simulated file system state
    this.fileSystem = {
      '/': {
        type: 'directory',
        children: {
          'home': {
            type: 'directory',
            children: {
              'user': {
                type: 'directory',
                children: {
                  'example.txt': {
                    type: 'file',
                    content: 'Hello, World!\nThis is a sample file.\nLine 3 of the file.',
                  },
                  'data.txt': {
                    type: 'file',
                    content: 'apple\nbanana\ncherry\ndate\nelderberry',
                  },
                  'numbers.txt': {
                    type: 'file',
                    content: '1\n2\n3\n4\n5',
                  },
                },
              },
            },
          },
          'tmp': {
            type: 'directory',
            children: {},
          },
          'etc': {
            type: 'directory',
            children: {
              'hosts': {
                type: 'file',
                content: '127.0.0.1 localhost',
              },
            },
          },
        },
      },
    };

    // Current working directory
    this.currentDir = '/home/user';

    // Environment variables
    this.env = {
      'HOME': '/home/user',
      'USER': 'user',
      'PATH': '/usr/local/bin:/usr/bin:/bin',
      'SHELL': '/bin/bash',
    };

    this.loaded = true;
  }

  /**
   * Load runtime (no-op for simulated shell)
   *
   * @returns {Promise<void>}
   */
  async load() {
    this.loaded = true;
    this.log('Shell simulation runtime ready', 'info');
    this.log('This is a SIMULATED shell environment - commands are NOT actually executed', 'info');
  }

  /**
   * Execute shell commands (simulated)
   *
   * @param {string} code - Shell commands to simulate
   * @param {Object} options - Execution options
   * @returns {Promise<{success: boolean, output: string, returnValue: any, error: Error|null, executionTime: number}>}
   */
  async execute(code, options = {}) {
    const startTime = performance.now();

    let result = {
      success: true,
      output: '',
      returnValue: 0,
      error: null,
      executionTime: 0,
    };

    try {
      // Split into individual commands (handle newlines and semicolons)
      const commands = code.split(/\n|;/).map(cmd => cmd.trim()).filter(cmd => cmd);

      let allOutput = [];

      for (const command of commands) {
        // Skip comments
        if (command.startsWith('#')) {
          continue;
        }

        // Parse and execute the command
        const output = this.executeCommand(command);
        if (output) {
          allOutput.push(output);
        }
      }

      result.output = allOutput.join('\n');
      this.log(result.output, 'stdout');
      result.success = true;
    } catch (error) {
      result.success = false;
      result.error = error;
      result.output = `Shell Error: ${error.message}`;
      result.returnValue = 1;
      this.logError(result.output);
    }

    const endTime = performance.now();
    result.executionTime = endTime - startTime;

    return result;
  }

  /**
   * Execute a single command
   *
   * @private
   * @param {string} command - Command to execute
   * @returns {string} Command output
   */
  executeCommand(command) {
    // Parse command and arguments
    const parts = this.parseCommand(command);
    if (parts.length === 0) return '';

    const cmd = parts[0];
    const args = parts.slice(1);

    // Route to appropriate command handler
    switch (cmd) {
      case 'echo':
        return this.cmdEcho(args);
      case 'pwd':
        return this.cmdPwd(args);
      case 'ls':
        return this.cmdLs(args);
      case 'cd':
        return this.cmdCd(args);
      case 'cat':
        return this.cmdCat(args);
      case 'grep':
        return this.cmdGrep(args);
      case 'wc':
        return this.cmdWc(args);
      case 'head':
        return this.cmdHead(args);
      case 'tail':
        return this.cmdTail(args);
      case 'mkdir':
        return this.cmdMkdir(args);
      case 'touch':
        return this.cmdTouch(args);
      case 'rm':
        return this.cmdRm(args);
      case 'cp':
        return this.cmdCp(args);
      case 'mv':
        return this.cmdMv(args);
      case 'env':
        return this.cmdEnv(args);
      case 'export':
        return this.cmdExport(args);
      case 'date':
        return this.cmdDate(args);
      case 'whoami':
        return this.cmdWhoami(args);
      case 'clear':
        return this.cmdClear(args);
      default:
        return `bash: ${cmd}: command not found\n(Simulated environment - only common commands supported)`;
    }
  }

  /**
   * Parse command into tokens (simple implementation)
   *
   * @private
   * @param {string} command - Command string
   * @returns {string[]} Tokens
   */
  parseCommand(command) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < command.length; i++) {
      const char = command[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = '';
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      tokens.push(current);
    }

    return tokens;
  }

  /**
   * Resolve path (absolute or relative)
   *
   * @private
   * @param {string} path - Path to resolve
   * @returns {string} Absolute path
   */
  resolvePath(path) {
    if (path.startsWith('/')) {
      return path;
    }

    // Handle relative paths
    const parts = this.currentDir.split('/').filter(p => p);
    const pathParts = path.split('/');

    for (const part of pathParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }

  /**
   * Get file/directory node from path
   *
   * @private
   * @param {string} path - Path to resolve
   * @returns {object|null} File system node
   */
  getNode(path) {
    const absolutePath = this.resolvePath(path);
    const parts = absolutePath.split('/').filter(p => p);

    let node = this.fileSystem['/'];

    for (const part of parts) {
      if (!node.children || !node.children[part]) {
        return null;
      }
      node = node.children[part];
    }

    return node;
  }

  // Command implementations

  cmdEcho(args) {
    // Handle variable expansion
    const output = args.map(arg => {
      if (arg.startsWith('$')) {
        const varName = arg.slice(1);
        return this.env[varName] || '';
      }
      return arg;
    }).join(' ');

    return output;
  }

  cmdPwd(args) {
    return this.currentDir;
  }

  cmdLs(args) {
    const path = args[0] || '.';
    const node = this.getNode(path);

    if (!node) {
      return `ls: cannot access '${path}': No such file or directory`;
    }

    if (node.type === 'file') {
      return path.split('/').pop();
    }

    if (!node.children) {
      return '';
    }

    const items = Object.keys(node.children).sort();
    return items.join('  ');
  }

  cmdCd(args) {
    if (args.length === 0) {
      this.currentDir = this.env['HOME'];
      return '';
    }

    const path = args[0];
    const node = this.getNode(path);

    if (!node) {
      return `cd: ${path}: No such file or directory`;
    }

    if (node.type !== 'directory') {
      return `cd: ${path}: Not a directory`;
    }

    this.currentDir = this.resolvePath(path);
    return '';
  }

  cmdCat(args) {
    if (args.length === 0) {
      return 'cat: missing file operand';
    }

    const results = [];
    for (const path of args) {
      const node = this.getNode(path);

      if (!node) {
        results.push(`cat: ${path}: No such file or directory`);
        continue;
      }

      if (node.type !== 'file') {
        results.push(`cat: ${path}: Is a directory`);
        continue;
      }

      results.push(node.content);
    }

    return results.join('\n');
  }

  cmdGrep(args) {
    if (args.length < 2) {
      return 'grep: usage: grep PATTERN [FILE]';
    }

    const pattern = args[0];
    const path = args[1];
    const node = this.getNode(path);

    if (!node) {
      return `grep: ${path}: No such file or directory`;
    }

    if (node.type !== 'file') {
      return `grep: ${path}: Is a directory`;
    }

    const lines = node.content.split('\n');
    const matches = lines.filter(line => line.includes(pattern));

    return matches.join('\n');
  }

  cmdWc(args) {
    if (args.length === 0) {
      return 'wc: missing file operand';
    }

    const path = args[0];
    const node = this.getNode(path);

    if (!node) {
      return `wc: ${path}: No such file or directory`;
    }

    if (node.type !== 'file') {
      return `wc: ${path}: Is a directory`;
    }

    const lines = node.content.split('\n').length;
    const words = node.content.split(/\s+/).filter(w => w).length;
    const chars = node.content.length;

    return `  ${lines}  ${words}  ${chars} ${path}`;
  }

  cmdHead(args) {
    const n = 10;
    const path = args[args.length - 1];
    const node = this.getNode(path);

    if (!node) {
      return `head: ${path}: No such file or directory`;
    }

    if (node.type !== 'file') {
      return `head: ${path}: Is a directory`;
    }

    const lines = node.content.split('\n');
    return lines.slice(0, n).join('\n');
  }

  cmdTail(args) {
    const n = 10;
    const path = args[args.length - 1];
    const node = this.getNode(path);

    if (!node) {
      return `tail: ${path}: No such file or directory`;
    }

    if (node.type !== 'file') {
      return `tail: ${path}: Is a directory`;
    }

    const lines = node.content.split('\n');
    return lines.slice(-n).join('\n');
  }

  cmdMkdir(args) {
    if (args.length === 0) {
      return 'mkdir: missing operand';
    }

    return `[SIMULATED] Would create directory: ${args[0]}`;
  }

  cmdTouch(args) {
    if (args.length === 0) {
      return 'touch: missing file operand';
    }

    return `[SIMULATED] Would create/update file: ${args[0]}`;
  }

  cmdRm(args) {
    if (args.length === 0) {
      return 'rm: missing operand';
    }

    return `[SIMULATED] Would remove: ${args.join(', ')}`;
  }

  cmdCp(args) {
    if (args.length < 2) {
      return 'cp: missing file operand';
    }

    return `[SIMULATED] Would copy ${args[0]} to ${args[1]}`;
  }

  cmdMv(args) {
    if (args.length < 2) {
      return 'mv: missing file operand';
    }

    return `[SIMULATED] Would move ${args[0]} to ${args[1]}`;
  }

  cmdEnv(args) {
    return Object.entries(this.env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
  }

  cmdExport(args) {
    if (args.length === 0) {
      return this.cmdEnv(args);
    }

    const [assignment] = args;
    const [key, value] = assignment.split('=');

    if (value) {
      this.env[key] = value;
      return `[SIMULATED] Exported ${key}=${value}`;
    }

    return '';
  }

  cmdDate(args) {
    return new Date().toString();
  }

  cmdWhoami(args) {
    return this.env['USER'];
  }

  cmdClear(args) {
    return '\n'.repeat(50) + 'Screen cleared (simulated)';
  }

  /**
   * Dispose of shell runtime
   */
  async dispose() {
    this.fileSystem = null;
    this.env = null;
    await super.dispose();
    this.log('Shell runtime disposed', 'info');
  }

  /**
   * Get information about shell runtime
   *
   * @returns {object} Runtime information
   */
  getLibraryInfo() {
    return {
      name: 'Shell (Simulated)',
      version: 'Bash 5.x Compatible',
      type: 'Educational Simulation',
      features: [
        'Common Unix commands',
        'File system simulation',
        'Environment variables',
        'Path resolution',
        'Command pipelines (basic)',
        'Safe learning environment',
      ],
      supportedCommands: [
        'echo', 'pwd', 'ls', 'cd', 'cat', 'grep', 'wc',
        'head', 'tail', 'mkdir', 'touch', 'rm', 'cp', 'mv',
        'env', 'export', 'date', 'whoami', 'clear',
      ],
      limitations: [
        'Does NOT execute real shell commands',
        'Simulated file system only',
        'Limited command set',
        'No actual file I/O',
        'Educational purposes only',
      ],
      security: 'SAFE - No actual command execution',
      documentation: 'https://www.gnu.org/software/bash/manual/',
    };
  }
}
