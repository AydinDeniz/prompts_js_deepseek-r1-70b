// sanitizer.js
const he = require('he');
const sqlInjection = require('sql-injection');
const { isEmail } = require('validator');

class Sanitizer {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.rules = this.loadTenantRules();
    this.defaultRules = {
      xss: true,
      sqli: true,
      email: true,
      custom: []
    };
  }

  loadTenantRules() {
    try {
      const rules = require(`./tenants/${this.tenantId}/rules.json`);
      return rules;
    } catch (error) {
      console.error('Error loading tenant rules:', error);
      return {};
    }
  }

  sanitize(input, context = {}) {
    try {
      // Apply context-aware rules
      const appliedRules = this.applyContext(context);

      // Sanitize HTML
      if (appliedRules.xss) {
        input = this.sanitizeXSS(input);
      }

      // Protect against SQL injection
      if (appliedRules.sqli) {
        input = this.sanitizeSQL(input);
      }

      // Validate email format
      if (appliedRules.email) {
        input = this.validateEmail(input);
      }

      // Apply custom rules
      if (appliedRules.custom && appliedRules.custom.length > 0) {
        input = this.applyCustomRules(input, appliedRules.custom);
      }

      return input;
    } catch (error) {
      console.error('Sanitization error:', error);
      throw error;
    }
  }

  applyContext(context) {
    const rules = { ...this.defaultRules, ...this.rules };
    if (context.field) {
      rules.custom = rules.custom.concat(context.field.rules || []);
    }
    return rules;
  }

  sanitizeXSS(input) {
    return he.escape(input, {
      allow: he.ALLOWED_TAGS.concat(this.rules.xss.allow || []),
      disallowed: this.rules.xss.disallow || []
    });
  }

  sanitizeSQL(input) {
    if (sqlInjection.detect(input)) {
      throw new Error('SQL injection attempt detected');
    }
    return input;
  }

  validateEmail(input) {
    if (!isEmail(input)) {
      throw new Error('Invalid email format');
    }
    return input;
  }

  applyCustomRules(input, rules) {
    return rules.reduce((acc, rule) => {
      return rule.fn(acc, rule.options);
    }, input);
  }

  addCustomRule(ruleId, ruleFn, options = {}) {
    this.rules.custom.push({ id: ruleId, fn: ruleFn, options });
  }

  removeCustomRule(ruleId) {
    this.rules.custom = this.rules.custom.filter(rule => rule.id !== ruleId);
  }
}

module.exports = Sanitizer;