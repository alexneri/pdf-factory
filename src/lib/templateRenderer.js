const fs = require('fs');
const path = require('path');

/**
 * Simple template renderer using Mustache-like syntax
 * Supports {{variable}} and {{#condition}}...{{/condition}}
 */
function renderTemplate(template, data) {
  let result = template;
  
  // Handle conditional blocks {{#key}}...{{/key}}
  // Process iteratively to avoid ReDoS
  while (true) {
    const startMatch = result.match(/\{\{#(\w+)\}\}/);
    if (!startMatch) break;
    
    const key = startMatch[1];
    const startPos = startMatch.index;
    const endTag = `{{/${key}}}`;
    const endPos = result.indexOf(endTag, startPos);
    
    if (endPos === -1) break; // No matching end tag
    
    const contentStart = startPos + startMatch[0].length;
    const content = result.substring(contentStart, endPos);
    
    const value = data[key];
    let replacement = '';
    
    if (value !== undefined && value !== null && value !== false && value !== '') {
      if (Array.isArray(value)) {
        replacement = value.map(item => renderTemplate(content, item)).join('');
      } else {
        replacement = renderTemplate(content, data);
      }
    }
    
    result = result.substring(0, startPos) + replacement + result.substring(endPos + endTag.length);
  }
  
  // Handle simple variable substitution {{key}}
  const variableRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(variableRegex, (match, key) => {
    return data[key] !== undefined ? data[key] : '';
  });
  
  return result;
}

/**
 * Load and render a template file
 */
function loadTemplate(templatePath, data) {
  const template = fs.readFileSync(templatePath, 'utf-8');
  return renderTemplate(template, data);
}

/**
 * Get the path to a default template
 */
function getDefaultTemplatePath(name) {
  return path.join(__dirname, '..', 'templates', `${name}.html`);
}

module.exports = {
  renderTemplate,
  loadTemplate,
  getDefaultTemplatePath
};
