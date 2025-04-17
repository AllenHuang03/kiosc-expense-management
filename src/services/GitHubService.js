// src/services/GitHubService.js
import axios from 'axios';
import * as XLSX from 'xlsx';
import githubConfig from '../config/github-config';
import excelService from './ExcelService';

class GitHubService {
  /**
   * Get the GitHub token from config
   * @returns {string} GitHub personal access token
   */
  getToken() {
    return githubConfig.personalAccessToken;
  }

  /**
   * Get standard request headers with auth token
   * @returns {Object} Headers object with Authorization
   */
  getHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `token ${token}` } : {};
  }

  /**
   * Test connection to GitHub repository
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const { owner, repository } = githubConfig;
      const url = `https://api.github.com/repos/${owner}/${repository}`;
      
      await axios.get(url, { headers: this.getHeaders() });
      return true;
    } catch (error) {
      console.error('Error testing GitHub connection:', error);
      return false;
    }
  }

  /**
   * List all data files in the data directory
   * @returns {Promise<Array>} Array of data file metadata
   */
  async listDataFiles() {
    try {
      const { owner, repository, dataPath } = githubConfig;
      const url = `https://api.github.com/repos/${owner}/${repository}/contents/${dataPath}`;
      
      const response = await axios.get(url, { headers: this.getHeaders() });
      
      // Filter for Excel files only
      const excelFiles = response.data.filter(file => 
        file.type === 'file' && 
        (file.name.endsWith('.xlsx') || 
         file.name.endsWith('.xls') || 
         file.name.endsWith('.xlsm') || 
         file.name.endsWith('.xlsb'))
      );
      
      return excelFiles.map(file => ({
        name: file.name,
        path: file.path,
        size: file.size,
        sha: file.sha,
        downloadUrl: file.download_url
      }));
    } catch (error) {
      console.error('Error fetching data files from GitHub:', error);
      throw error;
    }
  }

  /**
   * Load data from an Excel file in the repository
   * @param {string} filename - The filename to load
   * @returns {Promise<Object>} The loaded data
   */
  async loadDataFromExcel(filename) {
    try {
      const { owner, repository, dataPath } = githubConfig;
      
      // First get a list of files to find the exact case-sensitive filename
      const files = await this.listDataFiles();
      
      // Find the file with a case-insensitive match
      const exactFile = files.find(file => 
        file.name.toLowerCase() === filename.toLowerCase()
      );
      
      if (!exactFile) {
        throw new Error(`File "${filename}" not found in repository`);
      }
      
      // Use the exact filename from the repository with correct case
      const exactFilename = exactFile.name;
      
      // Direct download from raw GitHub content
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repository}/${githubConfig.branch}/${dataPath}/${exactFilename}`;
      
      try {
        const fileResponse = await axios.get(rawUrl, {
          responseType: 'arraybuffer'
        });
        
        // Load Excel data using ExcelService
        return excelService.loadExcel(fileResponse.data, exactFilename);
      } catch (directError) {
        console.error('Error with direct download, trying API method:', directError);
        
        // Fall back to API method
        const url = `https://api.github.com/repos/${owner}/${repository}/contents/${dataPath}/${exactFilename}`;
        
        const response = await axios.get(url, { headers: this.getHeaders() });
        const downloadUrl = response.data.download_url;
        
        const apiResponse = await axios.get(downloadUrl, {
          headers: this.getHeaders(),
          responseType: 'arraybuffer'
        });
        
        // Load Excel data using ExcelService
        return excelService.loadExcel(apiResponse.data, exactFilename);
      }
    } catch (error) {
      console.error('Error loading data from GitHub:', error);
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - The buffer to convert
   * @returns {string} Base64 encoded string
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }

  /**
   * Save data to GitHub as an Excel file
   * @param {string} filename - The filename to save
   * @returns {Promise<Object>} The result of the save operation
   */
  async saveToGitHub(filename = 'KIOSC_Finance_Data.xlsx') {
    try {
      const { owner, repository, dataPath } = githubConfig;
      const path = `${dataPath}/${filename}`;
      
      // Get Excel data as array buffer
      const excelBuffer = excelService.saveToExcel();
      
      // Convert to base64 for GitHub API
      const base64Content = this.arrayBufferToBase64(excelBuffer);
      
      // Check if file already exists to get SHA
      let sha = null;
      try {
        const fileInfoUrl = `https://api.github.com/repos/${owner}/${repository}/contents/${path}`;
        const fileInfoResponse = await axios.get(fileInfoUrl, { headers: this.getHeaders() });
        sha = fileInfoResponse.data.sha;
      } catch (error) {
        // File doesn't exist yet, which is fine
      }
      
      // Create or update file
      const url = `https://api.github.com/repos/${owner}/${repository}/contents/${path}`;
      const payload = {
        message: `Update data file: ${filename}`,
        content: base64Content,
        branch: githubConfig.branch
      };
      
      if (sha) {
        payload.sha = sha; // Required for updates
      }
      
      const response = await axios.put(url, payload, { headers: this.getHeaders() });
      return response.data;
    } catch (error) {
      console.error('Error saving data to GitHub:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const githubService = new GitHubService();
export default githubService;