// Import required libraries
import axios from 'axios';

// Recipe API setup
const api = axios.create({
  baseURL: 'https://api.spoonacular.com/api/v1/',
  params: {
    apiKey: 'YOUR_API_KEY'
  }
});

// Search for recipes
async function searchRecipes(ingredients) {
  try {
    const response = await api.get('recipes/findByIngredients', {
      params: {
        ingredients: ingredients.join(','),
        number: 10
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching recipes:', error);
  }
}

// Get recipe details
async function getRecipeDetails(id) {
  try {
    const response = await api.get(`recipes/${id}/information`);
    return response.data;
  } catch (error) {
    console.error('Error getting recipe details:', error);
  }
}

// Plan meals for the week
async function planMeals(ingredients, days = 7) {
  try {
    const recipes = await searchRecipes(ingredients);
    const mealPlan = [];
    
    for (let i = 0; i < days; i++) {
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      mealPlan.push({
        day: i + 1,
        recipe: await getRecipeDetails(recipe.id)
      });
    }
    
    return mealPlan;
  } catch (error) {
    console.error('Error planning meals:', error);
  }
}

// Generate grocery list
async function generateGroceryList(recipes) {
  try {
    const ingredients = new Set();
    
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        ingredients.add(ingredient.name);
      }
    }
    
    return Array.from(ingredients);
  } catch (error) {
    console.error('Error generating grocery list:', error);
  }
}

// Nutritional insights
async function getNutritionFacts(recipeId) {
  try {
    const response = await api.get(`recipes/${recipeId}/nutritionWidget.json`);
    return response.data;
  } catch (error) {
    console.error('Error getting nutrition facts:', error);
  }
}
const express = require('express');
const app = express();
const axios = require('axios');

// Recipe API setup
const api = axios.create({
  baseURL: 'https://api.spoonacular.com/api/v1/',
  params: {
    apiKey: 'YOUR_API_KEY'
  }
});

// Search recipes endpoint
app.get('/api/recipes', async (req, res) => {
  try {
    const ingredients = req.query.ingredients.split(',');
    const response = await api.get('recipes/findByIngredients', {
      params: {
        ingredients: ingredients.join(','),
        number: 10
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error searching recipes' });
  }
});

// Recipe details endpoint
app.get('/api/recipe/:id', async (req, res) => {
  try {
    const response = await api.get(`recipes/${req.params.id}/information`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error getting recipe details' });
  }
});

// Meal planning endpoint
app.post('/api/meal-plan', async (req, res) => {
  try {
    const ingredients = req.body.ingredients;
    const days = req.body.days || 7;
    const recipes = await searchRecipes(ingredients);
    const mealPlan = [];
    
    for (let i = 0; i < days; i++) {
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      const details = await getRecipeDetails(recipe.id);
      mealPlan.push({
        day: i + 1,
        recipe: details
      });
    }
    
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ message: 'Error planning meals' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// Plan meals for the week
async function planMeals(ingredients, days = 7) {
  try {
    const recipes = await searchRecipes(ingredients);
    const mealPlan = [];
    
    for (let i = 0; i < days; i++) {
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      const details = await getRecipeDetails(recipe.id);
      mealPlan.push({
        day: i + 1,
        recipe: details
      });
    }
    
    return mealPlan;
  } catch (error) {
    console.error('Error planning meals:', error);
  }
}

// Display meal plan
async function displayMealPlan(ingredients) {
  try {
    const mealPlan = await planMeals(ingredients);
    const mealPlanDiv = document.getElementById('mealPlan');
    mealPlanDiv.innerHTML = '';
    
    for (const meal of mealPlan) {
      const mealElement = document.createElement('div');
      mealElement.innerHTML = `
        <h3>Day ${meal.day}</h3>
        <h4>${meal.recipe.title}</h4>
        <p>Ingredients: ${meal.recipe.ingredients.join(', ')}</p>
        <p>Instructions: ${meal.recipe.instructions}</p>
      `;
      mealPlanDiv.appendChild(mealElement);
    }
  } catch (error) {
    console.error('Error displaying meal plan:', error);
  }
}
// Generate grocery list
async function generateGroceryList(recipes) {
  try {
    const ingredients = new Set();
    
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        ingredients.add(ingredient.name);
      }
    }
    
    const list = Array.from(ingredients);
    const listElement = document.createElement('ul');
    
    for (const item of list) {
      const listItem = document.createElement('li');
      listItem.textContent = item;
      listElement.appendChild(listItem);
    }
    
    document.getElementById('groceryList').appendChild(listElement);
  } catch (error) {
    console.error('Error generating grocery list:', error);
  }
}