/**
 * FileManager.js
 *
 * File persistence management using IndexedDB
 *
 * Features:
 * - Save code files to IndexedDB
 * - Load files by name or ID
 * - List all saved files
 * - Delete files
 * - Export/import files
 * - File metadata (language, created, modified)
 *
 * Storage Structure:
 * - Database: drlee-ide-files
 * - Object Store: files
 * - Index: by language, by name
 */

export default class FileManager {
  constructor() {
    this.dbName = 'drlee-ide-files';
    this.dbVersion = 1;
    this.storeName = 'files';
    this.db = null;
  }

  /**
   * Initialize IndexedDB database
   *
   * @returns {Promise<void>}
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true,
          });

          // Create indexes
          objectStore.createIndex('name', 'name', { unique: false });
          objectStore.createIndex('language', 'language', { unique: false });
          objectStore.createIndex('modified', 'modified', { unique: false });
        }
      };
    });
  }

  /**
   * Save a file to IndexedDB
   *
   * @param {object} file - File object to save
   * @param {string} file.name - File name
   * @param {string} file.content - File content (code)
   * @param {string} file.language - Programming language
   * @param {number} [file.id] - File ID (for updates)
   * @returns {Promise<number>} File ID
   */
  async saveFile(file) {
    if (!this.db) {
      throw new Error('FileManager not initialized. Call init() first.');
    }

    // Validate file
    if (!file.name || !file.content || !file.language) {
      throw new Error('File must have name, content, and language');
    }

    const now = Date.now();

    const fileData = {
      ...file,
      modified: now,
      created: file.created || now,
      size: file.content.length,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.put(fileData);

      request.onsuccess = () => {
        resolve(request.result); // Returns the file ID
      };

      request.onerror = () => {
        reject(new Error(`Failed to save file: ${request.error}`));
      };
    });
  }

  /**
   * Load a file by ID
   *
   * @param {number} id - File ID
   * @returns {Promise<object|null>} File object or null if not found
   */
  async loadFile(id) {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to load file: ${request.error}`));
      };
    });
  }

  /**
   * Load a file by name
   *
   * @param {string} name - File name
   * @returns {Promise<object|null>} File object or null if not found
   */
  async loadFileByName(name) {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index('name');

      const request = index.get(name);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error(`Failed to load file by name: ${request.error}`));
      };
    });
  }

  /**
   * Get all files
   *
   * @param {object} [options] - Query options
   * @param {string} [options.language] - Filter by language
   * @param {string} [options.sortBy] - Sort field ('modified', 'name')
   * @param {string} [options.order] - Sort order ('asc', 'desc')
   * @returns {Promise<object[]>} Array of file objects
   */
  async getAllFiles(options = {}) {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      let request;

      // Use index if filtering by language
      if (options.language) {
        const index = objectStore.index('language');
        request = index.getAll(options.language);
      } else {
        request = objectStore.getAll();
      }

      request.onsuccess = () => {
        let files = request.result;

        // Sort if requested
        if (options.sortBy) {
          files.sort((a, b) => {
            const aVal = a[options.sortBy];
            const bVal = b[options.sortBy];

            if (options.order === 'desc') {
              return bVal < aVal ? -1 : bVal > aVal ? 1 : 0;
            } else {
              return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            }
          });
        }

        resolve(files);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get files: ${request.error}`));
      };
    });
  }

  /**
   * Delete a file by ID
   *
   * @param {number} id - File ID
   * @returns {Promise<void>}
   */
  async deleteFile(id) {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete file: ${request.error}`));
      };
    });
  }

  /**
   * Delete all files
   *
   * @returns {Promise<void>}
   */
  async deleteAllFiles() {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete all files: ${request.error}`));
      };
    });
  }

  /**
   * Get file count
   *
   * @param {string} [language] - Filter by language
   * @returns {Promise<number>} Number of files
   */
  async getFileCount(language) {
    if (!this.db) {
      throw new Error('FileManager not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const objectStore = transaction.objectStore(this.storeName);

      let request;

      if (language) {
        const index = objectStore.index('language');
        request = index.count(language);
      } else {
        request = objectStore.count();
      }

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to count files: ${request.error}`));
      };
    });
  }

  /**
   * Export all files as JSON
   *
   * @returns {Promise<string>} JSON string of all files
   */
  async exportFiles() {
    const files = await this.getAllFiles();
    return JSON.stringify(files, null, 2);
  }

  /**
   * Import files from JSON
   *
   * @param {string} json - JSON string of files
   * @param {boolean} [clear=false] - Clear existing files before import
   * @returns {Promise<number>} Number of files imported
   */
  async importFiles(json, clear = false) {
    try {
      const files = JSON.parse(json);

      if (!Array.isArray(files)) {
        throw new Error('Invalid import data: expected array of files');
      }

      if (clear) {
        await this.deleteAllFiles();
      }

      let count = 0;
      for (const file of files) {
        // Remove ID to create new files
        const fileData = { ...file };
        delete fileData.id;

        await this.saveFile(fileData);
        count++;
      }

      return count;
    } catch (error) {
      throw new Error(`Failed to import files: ${error.message}`);
    }
  }

  /**
   * Search files by name or content
   *
   * @param {string} query - Search query
   * @param {object} [options] - Search options
   * @param {boolean} [options.searchContent=false] - Search in file content
   * @param {string} [options.language] - Filter by language
   * @returns {Promise<object[]>} Array of matching files
   */
  async searchFiles(query, options = {}) {
    const files = await this.getAllFiles({ language: options.language });

    const lowercaseQuery = query.toLowerCase();

    return files.filter((file) => {
      // Search in file name
      const nameMatch = file.name.toLowerCase().includes(lowercaseQuery);

      // Search in content if requested
      const contentMatch =
        options.searchContent &&
        file.content.toLowerCase().includes(lowercaseQuery);

      return nameMatch || contentMatch;
    });
  }

  /**
   * Create example files for new users
   *
   * @returns {Promise<number>} Number of example files created
   */
  async createExampleFiles() {
    const examples = [
      {
        name: 'sales_data.csv',
        language: 'javascript', // CSV files use javascript for syntax highlighting
        content: `date,product,quantity,price,customer_id,region
2024-01-15,Laptop,2,1299.99,C001,North
2024-01-16,Mouse,5,24.99,C002,South
2024-01-16,Keyboard,3,79.99,C001,North
2024-01-17,Monitor,1,399.99,C003,East
2024-01-18,Laptop,1,1299.99,C004,West
2024-01-19,Mouse,10,24.99,C005,South
2024-01-20,Keyboard,2,79.99,C002,South
2024-01-21,Monitor,2,399.99,C006,North
2024-01-22,Laptop,3,1299.99,C007,East
2024-01-23,Mouse,8,24.99,C003,East
2024-01-24,Keyboard,4,79.99,C008,West
2024-01-25,Monitor,1,399.99,C001,North
2024-01-26,Laptop,2,1299.99,C009,South
2024-01-27,Mouse,6,24.99,C010,West
2024-01-28,Keyboard,5,79.99,C004,West
2024-01-29,Monitor,3,399.99,C005,South
2024-01-30,Laptop,1,1299.99,C002,South`,
      },
      {
        name: '📚 Tutorial - CSV to SQLite Data Analysis.py',
        language: 'python',
        content: `# ===================================================================
# 📚 TUTORIAL: CSV to SQLite Database Analysis
# ===================================================================
#
# This tutorial demonstrates how to:
# 1. Load CSV data in DrLee IDE
# 2. Import it into SQLite database
# 3. Perform data analysis with SQL queries
# 4. Generate insights from your data
#
# STEP 1: Press Ctrl+Enter to run this tutorial!
# ===================================================================

import micropip
import io

# The sales_data.csv file is already loaded in the File Explorer!
# In a real scenario, you'd read it like this:
csv_data = """date,product,quantity,price,customer_id,region
2024-01-15,Laptop,2,1299.99,C001,North
2024-01-16,Mouse,5,24.99,C002,South
2024-01-16,Keyboard,3,79.99,C001,North
2024-01-17,Monitor,1,399.99,C003,East
2024-01-18,Laptop,1,1299.99,C004,West
2024-01-19,Mouse,10,24.99,C005,South
2024-01-20,Keyboard,2,79.99,C002,South
2024-01-21,Monitor,2,399.99,C006,North
2024-01-22,Laptop,3,1299.99,C007,East
2024-01-23,Mouse,8,24.99,C003,East
2024-01-24,Keyboard,4,79.99,C008,West
2024-01-25,Monitor,1,399.99,C001,North
2024-01-26,Laptop,2,1299.99,C009,South
2024-01-27,Mouse,6,24.99,C010,West
2024-01-28,Keyboard,5,79.99,C004,West
2024-01-29,Monitor,3,399.99,C005,South
2024-01-30,Laptop,1,1299.99,C002,South"""

print("=" * 70)
print("📊 CSV to SQLite Data Analysis Tutorial")
print("=" * 70)
print()

# ===================================================================
# STEP 2: Load pandas for CSV parsing (first time takes ~10 seconds)
# ===================================================================
print("📦 Loading pandas library...")
await micropip.install('pandas')
import pandas as pd
print("✓ Pandas loaded successfully!")
print()

# ===================================================================
# STEP 3: Parse CSV data
# ===================================================================
print("📄 Parsing CSV data...")
df = pd.read_csv(io.StringIO(csv_data))
print(f"✓ Loaded {len(df)} rows of sales data")
print()
print("Preview of data:")
print(df.head())
print()

# ===================================================================
# STEP 4: Use SQLite to analyze the data
# ===================================================================
print("=" * 70)
print("💾 SQLite Analysis")
print("=" * 70)
print()

# DrLee IDE has built-in SQLite support via sql.js!
# Switch to SQLite tab and run these queries:

print("""
-- Create table and import CSV data:
CREATE TABLE sales (
    date TEXT,
    product TEXT,
    quantity INTEGER,
    price REAL,
    customer_id TEXT,
    region TEXT
);

-- Insert your CSV data, then run analytics:

-- 1. Total Revenue by Product
SELECT
    product,
    SUM(quantity) as total_units,
    ROUND(SUM(quantity * price), 2) as total_revenue
FROM sales
GROUP BY product
ORDER BY total_revenue DESC;

-- 2. Top Regions by Sales
SELECT
    region,
    COUNT(*) as num_transactions,
    ROUND(SUM(quantity * price), 2) as revenue
FROM sales
GROUP BY region
ORDER BY revenue DESC;

-- 3. Daily Revenue Trend
SELECT
    date,
    COUNT(*) as transactions,
    ROUND(SUM(quantity * price), 2) as daily_revenue
FROM sales
GROUP BY date
ORDER BY date;
""")

# ===================================================================
# STEP 5: Python Data Analysis
# ===================================================================
print("=" * 70)
print("🐍 Python pandas Analysis")
print("=" * 70)
print()

# Calculate revenue
df['revenue'] = df['quantity'] * df['price']

# Top products by revenue
print("Top Products by Revenue:")
product_revenue = df.groupby('product')['revenue'].sum().sort_values(ascending=False)
for product, revenue in product_revenue.items():
    print(f"  • {product}: \${revenue:,.2f}")
print()

# Regional analysis
print("Revenue by Region:")
region_revenue = df.groupby('region')['revenue'].sum().sort_values(ascending=False)
for region, revenue in region_revenue.items():
    print(f"  • {region}: \${revenue:,.2f}")
print()

# Summary statistics
print("Summary Statistics:")
print(f"  • Total Revenue: \${df['revenue'].sum():,.2f}")
print(f"  • Average Order Value: \${df['revenue'].mean():,.2f}")
print(f"  • Total Transactions: {len(df)}")
print(f"  • Unique Customers: {df['customer_id'].nunique()}")
print()

print("=" * 70)
print("✨ Tutorial Complete!")
print("=" * 70)
print()
print("Next Steps:")
print("1. Modify this script to analyze your own data")
print("2. Try the SQL queries in the SQLite tab")
print("3. Export results using the Download button")
print("4. Upload your own CSV files using drag-and-drop!")
`,
      },
    ];

    let count = 0;
    for (const example of examples) {
      await this.saveFile(example);
      count++;
    }

    return count;
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get storage usage statistics
   *
   * @returns {Promise<object>} Storage statistics
   */
  async getStorageStats() {
    const files = await this.getAllFiles();

    const stats = {
      totalFiles: files.length,
      totalSize: 0,
      byLanguage: {},
    };

    files.forEach((file) => {
      stats.totalSize += file.size || 0;

      if (!stats.byLanguage[file.language]) {
        stats.byLanguage[file.language] = {
          count: 0,
          size: 0,
        };
      }

      stats.byLanguage[file.language].count++;
      stats.byLanguage[file.language].size += file.size || 0;
    });

    return stats;
  }
}
