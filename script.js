var ingredients = localStorage.getItem("pantryList"); // When input grab is available change query to input
var edamamQueryURL = "https://api.edamam.com/search?q=";
var appId = "&app_id=595f4e2b";
var apiKey = "&app_key=d8d22c089617d4cfbff9ce15762ee548";
var spoonacularKey = "fd6475bc93094d129e4695440a886f1a";
var recipeArray = [];
var ingredientArray = [];
var deferred;
var deferredArray = [];
var recipeAmountCount = 1;
var errorIngLines = [];

// Edamam Ajax
function edamamAjax() {
  queryURL = edamamQueryURL + ingredients + appId + apiKey;
$.ajax({
  url: queryURL,
  method: "GET"
}).then(updatePage);  
}

edamamAjax();

// Display returned recipe data from Edamam
function updatePage(recipeData) {
  recipeArray = recipeData.hits; 
  console.log("-----edamam recipe data-----", recipeData);
    for (var i = 0; i < recipeAmountCount; i++) {
      var recipe = recipeData.hits[i];
      console.log(recipe);

      var recipeDiv = $("<div>");
      recipeDiv.appendTo(".recipe-section");
      recipeDiv.addClass("recipe-card");

      // Recipe Name
      var recipeName = recipeData.hits[i].recipe.label;
      var name = $("<h1>");
      name.html(recipeName);
      name.appendTo(recipeDiv);       

      var recipeCard = $(".recipe-card");
      var cardList = $("<div>");
      cardList.addClass("card-list");
      cardList.appendTo(recipeCard);
      var cardListItems = $("<ol>");
      cardListItems.addClass("card-list-items");
      cardListItems.appendTo(cardList);

      // Recipe Calories
      var recipeCalories = recipeData.hits[i].recipe.calories;
      var calories = $("<li>");
      calories.html("Recipe Calories: " + Math.round(recipeCalories));
      calories.appendTo(cardListItems);

      // Recipe Health Labels i.e Alcohol Free, Gluten Free
      var recipeHealthLabels = recipeData.hits[i].recipe.healthLabels;
      console.log(recipeHealthLabels);
      var health = $("<li>");
      health.html("Health Labels: " + [recipeHealthLabels]);
      health.appendTo(cardListItems);
      
      // Recipe Image
      var recipeImage = recipeData.hits[i].recipe.image;
      var img = $("<img>")
      img.attr("src", recipeImage);
      img.appendTo(recipeDiv);

      // Recipe Serving Amount
      var recipeServings = recipeData.hits[i].recipe.yield;
      var servings = $("<p>")
      servings.html("Servings : " + recipeServings);
      servings.appendTo(recipeDiv);

      // Recipe Source
      var recipeSource = recipeData.hits[i].recipe.source;
      var source = $("<p>")
      source.html("Source : " + recipeSource);
      source.appendTo(recipeDiv);

      // Recipe URL
      var recipeURL = recipeData.hits[i].recipe.url;
      var cardURL = $("<a>")
      cardURL.html("Recipe Summary");
      cardURL.attr("href", recipeURL);
      cardURL.attr("target", "_blank")
      cardURL.appendTo(recipeDiv);
  
      var ingLines = recipeData.hits[i].recipe.ingredientLines;
      
      parseIngredients(ingLines);
      console.log("------deferredArray------",deferredArray);
      console.log("------length: "+ deferredArray.length + "--------");
  
      console.log("------defArray[0].readyState-------", deferredArray[0].readyState);
      $.when.apply($, deferredArray).done(function(){
      buildIngredientsList(ingredientArray);
    });
    
   
    
  
      
  }
}

// Takes an array of Ingredient Lines (i.e. ["4 Cups of Chicken Broth", "2 Teaspoons of Salt"]) as an argument and returns an array with an Ingredient object for each Ingredient Lin.e
function parseIngredients(ingLines){
  for(var i = 0; i < ingLines.length; i++){

    deferred = $.ajax({
      url: "https://api.spoonacular.com/recipes/parseIngredients?ingredientList="+ ingLines[i] + "&apiKey=" + spoonacularKey,
      beforeSend: function(xhr){
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      },
      method: "POST",
      success: function(response){
        parseIngredientOBJ = response;
        console.log("-----response-----", response);

        //If api cant find information on the ingredient line, the returned name will be "". If thats the case, push that ing line into an array of error ing lines.
        if(response[0].name.length === 0){
          errorIngLines.push(ingLines[i]);
        } else{
          var ingOBJ = {
            line: response[0].original,
            name: response[0].name,
            id: response[0].id,
            imgURL: "https://spoonacular.com/cdn/ingredients_100x100/" + response[0].name,
            unit: response[0].unit,
            amount: response[0].amount,
            amountCost: response[0].estimatedCost.value,
            packageCost: -1
          };
          ingredientArray.push(ingOBJ);   
        }
        
      }
      
    });
  
    deferredArray.push(deferred);

  }
  
  
}

// Build ingredient list from spoonacular
function buildIngredientsList(ingArray){

  console.log("Running build ing list!");
  console.log("------ingArray length: " + ingredientArray.length + "-------");
  var subTotal = 0;
  var ingDiv = $("<div>").addClass("ingredient-div");
  var ingTable = $("<table>").attr("id", "ingredient-table");
  ingDiv.append(ingTable);
  ingDiv.appendTo("body");

  
  var ingTableHeadRow = $("<tr>");
  ingTableHeadRow.append($("<th>").html("Image"));
  ingTableHeadRow.append($("<th>").html("Ingredient Line"));
  ingTableHeadRow.append($("<th>").html("Cost"));
  ingTableHeadRow.append($("<th>").html("Shopping Link"));
  ingTable.append(ingTableHeadRow);

  console.log(Array.isArray(ingArray));
  console.log(ingArray.length);
  ingArray.forEach(function(ingredient){
    console.log("in the loop!")
    console.log(ingredient);
    var ingImage = $("<td>").append($("<img>").attr(ingredient.imgURL));
    var ingLine = $("<td>").append($("<p>").html(ingredient.line));
    var ingCost = $("<td>").append($("<p>").html("$" + (ingredient.amountCost/100).toFixed(2)));
    var ingLink = $("<td>").append($("<a>").attr("href", "https://www.amazon.com/s?k=" + ingredient.name +"&i=grocery").html(ingredient.name));

    var ingRow = $("<tr>").append(ingImage, ingLine, ingCost, ingLink);
    $("#ingredient-table").append(ingRow);


    //If current ingredient is not part of the list of ingredients user entered, add ingredient cost to subTotal. 
    if(ingredients.indexOf(ingredient.name) === -1){
    subTotal += ingredient.amountCost;
    }

  });
  subTotal = "$" + Math.round(subTotal)/100; 

  ingDiv.append($("<h4>").html("Total Recipe Cost: " + subTotal));
}