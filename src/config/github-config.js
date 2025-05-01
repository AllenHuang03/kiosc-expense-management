// src/config/github-config.js

const githubConfig = {
    // GitHub repository details
    owner: 'allenhuang03',  // Replace with your GitHub username
    repository: 'kiosc-expense-management', // Repository name
    branch: 'main', // Main branch name
    
    // Paths within repository for data files
    dataPath: 'data', // Directory for Excel data files
    templatesPath: 'templates', // Directory for Excel templates
    
    // This token should be set in the app's environment or config
    // For development, you can set it directly here (but don't commit real tokens!)
    // For production, use environment variables
    
  };
  
  export default githubConfig;