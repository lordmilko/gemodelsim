//menu.js

/**
 * A condition indicating whether or not an error has occured during the current validation attempt.
 * Global to facilitate cleaner, simpler code
 * @type {boolean}
 */
var formErrorStatus;

/**
 * Enable the Menu
 * Called once the GEPlugin has been initialized
 */
function enableMenu() {

	$("#menuIconImg").show();
	$("#menuLink").show();
	changeMenuVisibility();
}

/**
 * Hide or Show the Menu
 */
function changeMenuVisibility() {
    if ($("#menuContentContent").is(":visible"))
        $("#menuContentContent").slideUp("fast");
	else
        $("#menuContentContent").slideDown("fast");
}

/**
 * Show the Menu if it's not already visible after a short delay
 */
function checkShowMenuAfterDelay() {

	setTimeout(function() {
	
		if(!$(".menu").is(":visible"))	{
			changeMenuVisibility();
		}
		
	}, 500);
}

/**
 * Show a Sub Menu for certain items when selected in a Drop-Down List,
 * e.g. specifying to input "Custom Information"
 * @param {Object} ddl A HTML Drop-Down List to check the selected value of
 * @param {Object} errorDiv A HTML div tag encapsulated by jQuery. Contains an error
 *				   message that may be currently displayed if input validation
 *				   previously failed
 * @param {Object} subMenu A jQuery encapsulated HTML div tag. Contains the Sub Menu
 *				   content to potentially be displayed
 */
function showSubMenu(ddl, errorDiv, subMenu) {

	errorDiv.children(".errorTxt:gt(0)").each(function() {
		checkHideShowError(errorDiv, $(this), false);
	});

	//Check whether to the value of ddl satisfies removing the no-value-selected error (if applicable)
	checkValueIsSelect(ddl, errorDiv);
	
	//Potentially show a Sub Menu for entering Custom Information
	showSectionSubMenu(ddl, subMenu, "custom");
}

/**
 * Potentially show a Sub Menu for entering Custom Information
 * @param {Object} ddl A HTML Drop-Down List to check the selected value of
 * @param {Object} subMenu A jQuery encapsulated HTML div tag. Contains the Sub Menu
 *				   content to potentially be displayed
 * @param {String} sectionVal The value the Drop-Down List should match against if the
 *				   Sub Menu is to be displayed
 */
function showSectionSubMenu(ddl, subMenu, sectionVal) {

	if($(ddl).val() == sectionVal)
		$(subMenu).slideDown("fast");
		
	//If the section is visible, slide it up. If it's not visible though this won't do anything
	else
		$(subMenu).slideUp("fast");
}

/**
 * Driver function for creating jQuery UI Slider Elements
 */
function createSliders() {
    $(createETASlider);
    $(createModelScaleSlider);
}

/**
 * Create the jQuery UI Slider for inputting the Route ETA
 */
function createETASlider() {
    var currentETA = $("#currentETA");
    var slider = $("#etaSlider");

    var max = 120;
    var min = 0;
    var startingVal = 0;

    var slideCB = function (event, ui) {

        if (ui.value == 0)
            currentETA.html("Real Time");
        else if (ui.value == 1)
            currentETA.html(ui.value + " min");
        else
            currentETA.html(ui.value + " mins");
    }

    createSlider(slider, max, min, startingVal, slideCB);
}

/**
 * Create the jQuery UI Slider for inputting the Model Scale
 */
function createModelScaleSlider() {
    var currentScale = $("#currentScale");
    var slider = $("#modelScaleSlider");

    var max = 100;
    var min = 1;
    var startingVal = 3;

    var slideCB = function (event, ui) {

        currentScale.html(ui.value + "x");
    }

    createSlider(slider, max, min, startingVal, slideCB);
}

/**
 * Create a jQuery UI Slider
 * @param {Object} div A jQuery encapsulated HTML div the Slider will be placed in
 * @param {number} max The maximum number the slider will slide to
 * @param {number} min The minimum number the slider will slide to
 * @param {number} startingVal The value the slider will start at
 * @callback slideCB The operations to perform whenever the Slider gets slidden
 */
function createSlider(div, max, min, startingVal, slideCB) {
    div.slider({
        max: max,
        min: min,
        value: startingVal,
        slide: function (event, ui) {
            slideCB(event, ui);
        }
    });
}

/**
 * Validate the Menu Form Fields have been filled in correctly
 * @param {Object} form The HTML DOM Menu Form Element
 */
function submitForm(form) {

	//Immediately disable the submit button so the user can't double click it (which would cause two instances of the same simulation to run)
	$("#submitForm").prop("disabled", true);

	//Reset the formErrorStatus for the current validation attempt
	formErrorStatus = false;
	
	//Perform validation on the entered values of each section (Route, Model and Travel Method)
	
	checkSelectedValue(form.route, $("#noRouteSelected"));
	checkSelectedValue(form.model, $("#noModelSelected"));
	checkSelectedValue(form.method, $("#noMethodSelected"));
	
	//Initialize the simulation
	simulationInitialization();
	
	//Re-enable the Submit Button
	reenableSubmitButton();
}

/**
 * Re-enable the Submit Button
 */
function reenableSubmitButton() {

	if(formErrorStatus) //If there was an error, re-enable the button immediately
		$("#submitForm").prop("disabled", false);
	
	/* If there wasn't an error, re-enabling the Submit Button immediately would still give the user the opportunity to double click it.
	 * The menu gets hidden shortly after the Submit Button was pressed, so the Submit Button will be re-enabled
	 * while the menu is collapsed, thereby eliminating the possibility of the user running two of the same simulation at once. */
	else
		setTimeout(function () { $("#submitForm").prop("disabled", false); }, 500);
}

/**
 * Driver function for checking an appropriate value has been selected in a Drop-Down List.
 * For certain values, i.e. "custom", additional validation will need to be performed
 * @param {Object} ddl A HTML Drop-Down List to check the selected value of
 * @param {Object} errorDiv A HTML div tag encapsulated by jQuery. Contains an error
				   message to display if validation fails
 */
function checkSelectedValue(ddl, errorDiv) {

	checkValueIsSelect(ddl, errorDiv); //Check whether the Selected Value is "select"

	checkValueIsCustom(ddl); //Check whether the Selected Value is "custom"
}

/**
 * Check whether a Drop-Down List's selected value is "select"
 * @param {Object} ddl A HTML Drop-Down List to check the selected value of
 * @param {Object} errorDiv A HTML div tag encapsulated by jQuery. Contains an error
				   message to display if validation fails
 */
function checkValueIsSelect(ddl, errorDiv) {
	
	var error = false;
	var errorDivTxt = $("#" + $(errorDiv).attr('id') + "Txt");
	
	if($(ddl).val() == "select") {
		error = true;
		formErrorStatus = true;
	}
	
	//Display an error if the selected value was "select"; if it wasn't, hide an error (if visible)
	checkHideShowError(errorDiv, errorDivTxt, error);
}

/**
 * Show or Hide an error based on whether an error has been determined to occur
 * @param {Object} errorDiv A HTML div encapsulated by jQuery, containing a set of potential error messages
 * @param {Object} errorDivTxt A HTML div encapsulated by jQuery containing the specific error message to display
 * @param {boolean} errorDivTxt Whether or not an error has been encountered
 */
function checkHideShowError(errorDiv, errorDivTxt, error) {
	if(error) {
		
	    $("#progressOverlay").hide();

		//setTimeout(function() { if(!$(".menu").is(":visible"))	{ changeMenuVisibility(); }}, 500);
		checkShowMenuAfterDelay();
		
		checkHideShowError(errorDiv, errorDivTxt, false); //Force the error message to disappear and reappear if unresolved
		errorDivTxt.show();
		errorDiv.slideDown("fast");
	}
	else {
		errorDiv.slideUp("fast");
		errorDiv.find(errorDivTxt).hide();
	}
}

/**
 * Perform validations if a Drop-Down List's selected value is "custom"
 * @param {Object} ddl A HTML Drop-Down List to check the selected value of
 */
function checkValueIsCustom(ddl) {

	//Perform additional validation if the user has specified to enter Custom Information
	if(customItemEntered($(ddl))) {
		checkCustomValues(ddl);
	}
}

/**
 * Determine whether a custom model has been specified to be entered
 * @param ddl A jQuery encapsulated HTML Drop-Down List tag
 */
function customItemEntered(ddl) {
	
	var isItemCustom = false;
	
	if(ddl.val() == "custom")
		isItemCustom = true;
	
	return isItemCustom;
}

/**
 * Driver function for performing additional validation on Custom Input.
 * Determine which validation sequence to run based on the Drop-Down List currently being validated
 * @param {Object} ddl A HTML Drop-Down List whose selected value was "custom"
 */
function checkCustomValues(ddl) {

	if(ddl.id == "route") {
		checkCustomRoute($("#customRouteError"));
	}
	else if(ddl.id == "model") {
		checkCustomModel($("#customModelError"));
	}
}

/**
 * Driver function for checking a Custom Route has been entered properly
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 */
function checkCustomRoute(errorDiv) {

	var error = false

	error = checkCustomRouteFieldsEmpty(errorDiv, $("#customRouteError_emptyField"));
	
	if(!error)
		checkCustomRouteValidChars(errorDiv, $("#customRouteError_invalidChars"));
}

/**
 * Check whether the "From" or "To" fields of a New Custom Route have been left empty
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 * @param {Object} errorDivTxt A jQuery encapsulated HTML div tag, containing the specific error message to display
 * @return {boolean} Whether or not an error was encountered
 */
function checkCustomRouteFieldsEmpty(errorDiv, errorDivTxt) {
	
	var error = false;

	if($("#customRouteFrom").val().length == 0 || $("#customRouteTo").val().length == 0) {
		error = true;
		formErrorStatus = true;
	}
	
	checkHideShowError(errorDiv, errorDivTxt, error);
	
	return error;
}

/**
 * Check whether the "From" or "To" fields of a New Custom Route contain any invalid characters
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 * @param {Object} errorDivTxt A jQuery encapsulated HTML div tag, containing the specific error message to display
 */
function checkCustomRouteValidChars(errorDiv, errorDivTxt) {
	var error = false;
	
	var from = $("#customRouteFrom").val();
	var to = $("#customRouteTo").val();
	
	var invalidChars = /;/; //A semicolon
	
	if(invalidChars.test(from) || invalidChars.test(to)) {
		error = true;
		formErrorStatus = true;
	}
	
	checkHideShowError(errorDiv, errorDivTxt, error);
}

/**
 * Driver function for checking a Custom Model has been entered properly
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 */
function checkCustomModel(errorDiv) {
	
	checkCustomModelURL(errorDiv, $("#customModelError_invalidURL"));
}

/**
 * Check a valid URL has been entered for the Custom Model
 * @param {Object} errorDiv A jQuery encapsulated HTML div tag, containing a set of potential error messages
 * @param {Object} errorDivTxt A jQuery encapsulated HTML div tag, containing the specific error message to display
 */
function checkCustomModelURL(errorDiv, errorDivTxt) {
	
	var error = false;
	
	var urlStartString = /^((http)|(https)|(ftp)):\/\//;
	
	var url = $("#kmzURL").val();
	
	//If the string doesn't start with the urlStartString, or end with a valid file extension, an invalid URL has been entered
	if(!urlStartString.test(url) || invalidURLFileExtension(url)) {
		error = true;
		formErrorStatus = true;
	}
	
	checkHideShowError(errorDiv, errorDivTxt, error);
}

/**
 * Driver function for checking the file extension of the entered URL
 * If the URL ends in a valid file extension, one of the two functions will return true,
 * resulting in the expression evaluating to false. If both functions evaluate to false,
 * the expression will evaluate to true
 * @param {String} url The URL to analyse the file extension of
 */
function invalidURLFileExtension(url) {

    var endsInKMZ = checkStringEndText(url, ".kmz");
    var endsInDae = checkStringEndText(url, ".dae");
    var endsInZip = checkStringEndText(url, ".zip");

    /* Logical AND on multiple false statements is FALSE: (FALSE && FALSE == FALSE). But by negating the statements instead,
     * we can express the use case of having failed to find a match: (NOT(FALSE) && NOT(FALSE) == TRUE). */
    return (!endsInKMZ && !endsInDae && !endsInZip);
}

/**
 * Check whether a string ends with a specified substring
 * @param {String} str The string to check the end of
 * @param {String} endTxt The substring to check for
 */
function checkStringEndText(str, endTxt) {
    var regexObj = new RegExp(endTxt + "$"); //In Regular Expressions, $ means "the end of the string"

    return regexObj.test(str);
}

/**
 * Determine what optgroup to add the Option Item to
 * @param {String} recordType The "Type" attribute for a given record
 * @param {String} menuSection The section of the Menu the optgroup is located in
 * @return {Object} A jQuery encapsulated HTML optgroup tag representing the optgroup an Option Item will be added to
 */
function determineMenuItemOptGroup(recordType, menuSection) {
	var optGroup;
	
	if(recordType == "Builtin")
		optGroup = $("#" + menuSection + "BuiltInOptGrp");
	else if(recordType == "Custom")
		optGroup = $("#" + menuSection + "RecentCustomOptGrp");
		
	return optGroup;
}

/**
 * Add a Drop-Down List Option to a specified optgroup, using a set of specified data for the Option Item's
 * Value and Text components.
 * The later an Option is discovered, the more recent it was entered into the database; we therefore
 * prepend it to the start of the optgroup, instead of appending it to the end
 * @param {Object} optgroup A jQuery encapsulated HTML optgroup tag, indicating the optgroup to add a new Option to
 * @param {String} optVal The value to use for the Option's Value attribute
 * @param {String} optTxt The value to use for the Option's Text component - the text that will be displayed
 *				   when the Drop-Down List is clicked
 */
function addToOptGroup(optgroup, optVal, optTxt) {

	var optionAlreadyExists = false;

	var optionToAdd = $("<option value='" + optVal + "'>" + optTxt + "</option>");
	
	optgroup.children().each(function() {
		if($(this).val() == optionToAdd.val())
			optionAlreadyExists = true;
	});

	if(!optionAlreadyExists)
		optgroup.prepend("<option value='" + optVal + "'>" + optTxt + "</option>");
}

/**
 * Cut down the number of entries in an option group to a specified max limit
 * @param {Object} optGroup A jQuery encapsulated HTML tag to remove entries from
 * @param {number} maxCustomItems The maximum number of entries to allow in optGroup
 * @callback removeDatabaseEntryCallback Remove items from their respective database records as well
 */
function removeOldCustomOptEntries(optGroup, maxCustomItems, removeDatabaseEntryCallback) {

	var optionCount = 0;
	
	optGroup.children("option").each(function() {
	
		optionCount++;
		
		if(optionCount > maxCustomItems) {
		
			removeDatabaseEntryCallback($(this).val());			
			$(this).remove();
		}
	});
}

/**
 * Driver function for moving a selected Recent Custom item to the top of its optgroup
 * Note: the individual item movement functions called here will check whether they need
 * to move anything to the top of their optgroups; if not, they won't do anything
 */
function adjustMenuItems() {
	
	moveSelectedMenuItemToTop("route", determineMenuItemOptGroup("Custom", "route"))
	moveSelectedMenuItemToTop("model", determineMenuItemOptGroup("Custom", "model"));
}

/**
 * Move a selected Recent Custom item to the top of its respective Drop-Down List optgroup
 * @param {String} ddl The value of a Drop-Down List's ID attribute
 * @param {Object} customOptions A jQuery encapsulated HTML optgroup tag
 */
function moveSelectedMenuItemToTop(ddl, customOptions) {
	
	var selectedOption = $("#" + ddl + " option:selected");

    //Check that an item from a Recent Custom optgroup was chosen
	if(selectedOption.parent().attr("id") == customOptions.attr("id"))
	{
		/* Count the number of elements that precede the selected option. As indexes start at 0, 
		 * the index of the selected option is equal to the number of elements behind it. (Its position
		 * would be the number of elements + 1 if indexes started at 1) */
		var optionPosition = selectedOption.prevAll().size();
		
		/* Get the previous Option and set it to be before the selectedOption. Repeat this for
		 * all elements that precede the selectedOption such that the selectedOption ends up at
		 * the top of the Drop-Down List */
		for(var i = 0; i < optionPosition; i++)
			selectedOption.prev().before(selectedOption);
	}
}

/**
 * Initialize the Route Simulation
 */
function simulationInitialization() {

	//If an error was encountered during the basic form validations simulationInitialization() will still be called, but will do nothing
	if(!formErrorStatus) {
		changeMenuVisibility();
		resetSimulation(modelSimulation);

		modelSimulation = new ModelSimulator(ge);
		
		$("#progressOverlay").hide();
		$("#progressOverlay").show();

		routeCreationDriver(createModel, modelSimulation);
	}
}

/**
 * Reset all changes a simulation made to itself and Google Earth
 * @param {ModelSimulator} simulator The simulator to reset
 */
function resetSimulation(simulator) {

	if(simulator) {
		simulator.doAnimation = false;

		simulator.ge.getOptions().setFlyToSpeed(initialFlyToSpeed);
		
		destroyGEFeatures(simulator);
		
		//Destroying a ModelSimulation is the safest way to reset all properties and values it may have right now or in the future
		simulator = null;
	}
}

/**
 * Remove certain features a simulation may have placed on Google Earth
 
 * Note: it is possible to modify this method to simply remove _all_ features that may have
 * been placed on a Google Earth instance. To be conservative, by default we will only
 * remove the features we explicitly want to get rid of. To remove all features,
 * simply iterate through and remove every last child
 
 * @param {ModelSimulator} simulator The simulator that placed features on Google Earth
 */
function destroyGEFeatures(simulator) {
	if(simulator.lineStringPlacemark) {
		simulator.ge.getFeatures().removeChild(simulator.lineStringPlacemark);
	}
	
	if(simulator.kmzModelPlacemark) {
		simulator.ge.getFeatures().removeChild(simulator.kmzModelPlacemark);
	}
}