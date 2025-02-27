// auth.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const usersPath = path.join(__dirname, 'users.json');

class Authenticator {
  constructor() {
    this.users = this.loadUsers();
  }

  loadUsers() {
    try {
      return JSON.parse(fs.readFileSync(usersPath, 'utf8')) || [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  hashPassword(password) {
    return bcrypt.hash(password, 10);
  }

  comparePasswords(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async register(username, password) {
    try {
      if (this.users.some(user => user.username === username)) {
        throw new Error('Username already exists');
      }

      const hashedPassword = await this.hashPassword(password);
      const user = {
        username,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      this.users.push(user);
      fs.writeFileSync(usersPath, JSON.stringify(this.users, null, 2));
      return user;
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  async login(username, password) {
    try {
      const user = this.users.find(u => u.username === username);
      if (!user) {
        throw new Error('Username not found');
      }

      const isValidPassword = await this.comparePasswords(password, user.password);
      if (!isValidPassword) {
        throw new Error('Incorrect password');
      }

      return {
        username: user.username,
        createdAt: user.createdAt
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  async changePassword(username, oldPassword, newPassword) {
    try {
      const user = this.users.find(u => u.username === username);
      if (!user) {
        throw new Error('Username not found');
      }

      const isValidPassword = await this.comparePasswords(oldPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Incorrect password');
      }

      const newHash = await this.hashPassword(newPassword);
      user.password = newHash;
      fs.writeFileSync(usersPath, JSON.stringify(this.users, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Password change failed: ${error.message}`);
    }
  }

  async deleteUser(username) {
    try {
      this.users = this.users.filter(u => u.username !== username);
      fs.writeFileSync(usersPath, JSON.stringify(this.users, null, 2));
      return true;
    } catch (error) {
      throw new Error(`User deletion failed: ${error.message}`);
    }
  }
}

module.exports = Authenticator;