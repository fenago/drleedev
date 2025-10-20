/**
 * Toast - Modern notification system
 *
 * Replaces browser alerts, confirms, and prompts with beautiful toast notifications
 *
 * Features:
 * - Success, error, warning, info notifications
 * - Confirm dialogs with callbacks
 * - Prompt dialogs with input
 * - Auto-dismiss or persistent
 * - Stacking multiple toasts
 * - Animations
 */

export default class Toast {
  constructor() {
    this.container = null;
    this.toasts = new Map(); // Map of toast ID -> toast element
    this.nextId = 1;
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    // Create container if it doesn't exist
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a success toast
   *
   * @param {string} message - Message to display
   * @param {number} [duration=3000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @returns {number} Toast ID
   */
  success(message, duration = 3000) {
    return this.show({
      type: 'success',
      message,
      icon: '✓',
      duration,
    });
  }

  /**
   * Show an error toast
   *
   * @param {string} message - Message to display
   * @param {number} [duration=5000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @returns {number} Toast ID
   */
  error(message, duration = 5000) {
    return this.show({
      type: 'error',
      message,
      icon: '✗',
      duration,
    });
  }

  /**
   * Show a warning toast
   *
   * @param {string} message - Message to display
   * @param {number} [duration=4000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @returns {number} Toast ID
   */
  warning(message, duration = 4000) {
    return this.show({
      type: 'warning',
      message,
      icon: '⚠',
      duration,
    });
  }

  /**
   * Show an info toast
   *
   * @param {string} message - Message to display
   * @param {number} [duration=3000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @returns {number} Toast ID
   */
  info(message, duration = 3000) {
    return this.show({
      type: 'info',
      message,
      icon: 'ℹ',
      duration,
    });
  }

  /**
   * Show a confirm dialog with Yes/No buttons
   *
   * @param {string} message - Message to display
   * @param {Object} [options] - Options
   * @param {Function} [options.onConfirm] - Callback when confirmed
   * @param {Function} [options.onCancel] - Callback when cancelled
   * @param {string} [options.confirmText='Yes'] - Confirm button text
   * @param {string} [options.cancelText='No'] - Cancel button text
   * @returns {Promise<boolean>} Resolves to true if confirmed, false if cancelled
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        onConfirm,
        onCancel,
        confirmText = 'Yes',
        cancelText = 'No',
      } = options;

      const toastId = this.show({
        type: 'confirm',
        message,
        icon: '?',
        duration: 0, // Don't auto-dismiss
        actions: [
          {
            text: cancelText,
            class: 'btn-secondary',
            onClick: () => {
              this.hide(toastId);
              if (onCancel) onCancel();
              resolve(false);
            },
          },
          {
            text: confirmText,
            class: 'btn-primary',
            onClick: () => {
              this.hide(toastId);
              if (onConfirm) onConfirm();
              resolve(true);
            },
          },
        ],
      });
    });
  }

  /**
   * Show a prompt dialog with input field
   *
   * @param {string} message - Message to display
   * @param {Object} [options] - Options
   * @param {string} [options.defaultValue=''] - Default input value
   * @param {string} [options.placeholder=''] - Input placeholder
   * @param {Function} [options.onConfirm] - Callback when confirmed
   * @param {Function} [options.onCancel] - Callback when cancelled
   * @returns {Promise<string|null>} Resolves to input value if confirmed, null if cancelled
   */
  prompt(message, options = {}) {
    return new Promise((resolve) => {
      const {
        defaultValue = '',
        placeholder = '',
        onConfirm,
        onCancel,
      } = options;

      let inputValue = defaultValue;

      const toastId = this.show({
        type: 'prompt',
        message,
        icon: '✏',
        duration: 0, // Don't auto-dismiss
        input: {
          value: defaultValue,
          placeholder,
          onChange: (value) => {
            inputValue = value;
          },
        },
        actions: [
          {
            text: 'Cancel',
            class: 'btn-secondary',
            onClick: () => {
              this.hide(toastId);
              if (onCancel) onCancel();
              resolve(null);
            },
          },
          {
            text: 'OK',
            class: 'btn-primary',
            onClick: () => {
              this.hide(toastId);
              if (onConfirm) onConfirm(inputValue);
              resolve(inputValue);
            },
          },
        ],
      });
    });
  }

  /**
   * Show a toast notification
   *
   * @param {Object} options - Toast options
   * @param {string} options.type - Toast type (success, error, warning, info, confirm, prompt)
   * @param {string} options.message - Message to display
   * @param {string} [options.icon] - Icon to display
   * @param {number} [options.duration=3000] - Auto-dismiss duration (0 = no auto-dismiss)
   * @param {Array} [options.actions] - Action buttons
   * @param {Object} [options.input] - Input field config (for prompt)
   * @returns {number} Toast ID
   */
  show(options) {
    const {
      type = 'info',
      message,
      icon,
      duration = 3000,
      actions = [],
      input = null,
    } = options;

    const toastId = this.nextId++;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.dataset.toastId = toastId;

    // Build toast HTML
    let html = '<div class="toast-content">';

    if (icon) {
      html += `<div class="toast-icon">${icon}</div>`;
    }

    html += `<div class="toast-body">`;
    html += `<div class="toast-message">${this.escapeHtml(message)}</div>`;

    // Add input field if prompt
    if (input) {
      html += `
        <input
          type="text"
          class="toast-input"
          value="${this.escapeHtml(input.value || '')}"
          placeholder="${this.escapeHtml(input.placeholder || '')}"
          autocomplete="off"
        />
      `;
    }

    // Add action buttons
    if (actions.length > 0) {
      html += '<div class="toast-actions">';
      for (const action of actions) {
        html += `
          <button class="toast-btn ${action.class || 'btn-secondary'}" data-action-id="${actions.indexOf(action)}">
            ${this.escapeHtml(action.text)}
          </button>
        `;
      }
      html += '</div>';
    }

    html += '</div>'; // toast-body
    html += '</div>'; // toast-content

    // Add close button for non-action toasts
    if (actions.length === 0) {
      html += '<button class="toast-close" title="Close">×</button>';
    }

    toast.innerHTML = html;

    // Attach event listeners
    this.attachToastListeners(toast, toastId, actions, input);

    // Add to container
    this.container.appendChild(toast);
    this.toasts.set(toastId, toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => this.hide(toastId), duration);
    }

    return toastId;
  }

  /**
   * Attach event listeners to toast
   */
  attachToastListeners(toast, toastId, actions, input) {
    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide(toastId));
    }

    // Action buttons
    const actionBtns = toast.querySelectorAll('.toast-btn');
    actionBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        if (actions[index] && actions[index].onClick) {
          actions[index].onClick();
        }
      });
    });

    // Input field
    if (input) {
      const inputField = toast.querySelector('.toast-input');
      if (inputField) {
        inputField.addEventListener('input', (e) => {
          if (input.onChange) {
            input.onChange(e.target.value);
          }
        });

        // Auto-focus input
        setTimeout(() => inputField.focus(), 100);

        // Submit on Enter
        inputField.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            const confirmBtn = toast.querySelector('.toast-btn.btn-primary');
            if (confirmBtn) confirmBtn.click();
          }
        });
      }
    }
  }

  /**
   * Hide a toast
   *
   * @param {number} toastId - Toast ID
   */
  hide(toastId) {
    const toast = this.toasts.get(toastId);
    if (!toast) return;

    // Animate out
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    // Remove after animation
    setTimeout(() => {
      toast.remove();
      this.toasts.delete(toastId);
    }, 300);
  }

  /**
   * Hide all toasts
   */
  hideAll() {
    for (const toastId of this.toasts.keys()) {
      this.hide(toastId);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
