const fs = require('fs');
const path = require('path');

/**
 * Simple template renderer using Mustache-like syntax
 * Supports {{variable}} and {{#condition}}...{{/condition}}
 */
function renderTemplate(template, data) {
  let result = template;
  
  // Handle conditional blocks {{#key}}...{{/key}}
  const conditionalRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  result = result.replace(conditionalRegex, (match, key, content) => {
    const value = data[key];
    if (value === undefined || value === null || value === false || value === '') {
      return '';
    }
    if (Array.isArray(value)) {
      return value.map(item => renderTemplate(content, item)).join('');
    }
    return renderTemplate(content, data);
  });
  
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
