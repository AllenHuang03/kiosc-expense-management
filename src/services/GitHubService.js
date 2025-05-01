// src/services/GitHubService.js
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import githubConfig from '../config/github-config';
import excelService from './ExcelService';

class GitHubService {
  /**
   * Test connection to GitHub repository
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const { owner, repository } = githubConfig;
      const url = `https://api.github.com/repos/${owner}/${repository}`;
      
      await axios.get(url);
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
      
      const response = await axios.get(url);
      
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

      // Determine if we're running on GitHub Pages
      const isGitHubPages = window.location.hostname.includes('github.io');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // If on GitHub Pages or mobile, attempt to load from a specific path
      if (isGitHubPages || isMobile) {
        try {
          console.log("Running on GitHub Pages or mobile, attempting to load from direct URL");
          
          // First try to load from the same origin
          const response = await fetch(`${window.location.origin}${window.location.pathname}data/${filename}`);
          
          if (!response.ok) {
            throw new Error(`Failed to load from direct URL: ${response.status}`);
          }
          
          const buffer = await response.arrayBuffer();
          return excelService.loadExcel(buffer, filename);
        } catch (directError) {
          console.warn("Failed to load from direct URL:", directError);
          
          // If direct loading fails, use dataInitializer
          console.log("Using default data structure from DataInitializer");
          const dataInitializer = (await import('../utils/DataInitializer')).default;
          return dataInitializer.initializeData();
        }
      }

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
        
        const response = await axios.get(url);
        const downloadUrl = response.data.download_url;
        
        const apiResponse = await axios.get(downloadUrl, {
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
   * Save data locally as an Excel file for manual GitHub upload
   * @param {string} filename - The filename to save
   * @returns {Promise<Object>} Information about the download
   */
  async saveToGitHub(filename = 'KIOSC_Finance_Data.xlsx') {
    try {
      // Generate Excel buffer
      const excelBuffer = excelService.saveToExcel();
      
      // Create a blob for download
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Use saveAs from FileSaver.js if available (requires importing FileSaver)
      if (typeof saveAs === 'function') {
        saveAs(blob, filename);
        return {
          success: true,
          message: 'Data exported for manual update. Please commit this file to GitHub manually.'
        };
      }
      
      // Fallback to creating a download link with user interaction
      const url = window.URL.createObjectURL(blob);
      
      // Instead of programmatically clicking, return the URL for UI-initiated download
      return {
        success: true,
        url: url,
        filename: filename,
        message: 'Click the download button to save the file, then commit to GitHub manually.'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }
  
}

// Create and export a singleton instance
const githubService = new GitHubService();
export default githubService;